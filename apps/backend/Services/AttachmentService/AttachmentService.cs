using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.AttachmentService;

/// <summary>
/// Stores an uploaded image on disk and hands back the path to serve it from.
///
/// Local disk rather than blob storage: this API is deployed to IIS beside its
/// own content root, and there are no cloud storage credentials in any
/// configuration file. The folder is configurable so a deployment can point it
/// at a share that survives a redeploy — <c>bin</c> does not.
///
/// The threat model for "let an administrator upload a photo" is small but real,
/// so this deliberately does not trust anything the client says:
///
///  - the client's filename is never used, anywhere. A generated GUID name with
///    an extension derived from the *content type* removes path traversal
///    ("../../web.config"), overwrites of existing files, and the double
///    extension trick ("photo.jpg.aspx") in one stroke.
///  - only the three image types the picker offers are accepted, checked against
///    the declared content type and the file's own magic bytes, because a
///    content type is just a string the caller chose.
///  - size is capped before anything is written.
/// </summary>
public interface IAttachmentService
{
    Task<ServiceResponseDto<string>> SaveImageAsync(IFormFile? file);
}

public class AttachmentService : IAttachmentService
{
    /// <summary>Matches the 2 MB the web picker enforces before it uploads.</summary>
    private const long MaxBytes = 2 * 1024 * 1024;

    /// <summary>Web path the files are served under; see UseStaticFiles in Program.cs.</summary>
    public const string RequestPath = "/uploads";

    private static readonly Dictionary<string, string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
    };

    private readonly string _root;
    private readonly ILogger<AttachmentService> _logger;

    public AttachmentService(IConfiguration configuration, IWebHostEnvironment environment,
        ILogger<AttachmentService> logger)
    {
        _logger = logger;
        _root = ResolveRoot(configuration, environment);
    }

    /// <summary>
    /// Where uploads live. Pure path arithmetic — this touches no disk, so it is
    /// safe to call during startup.
    ///
    /// Static because Program.cs needs the same path to point UseStaticFiles at,
    /// and it runs before there is a request scope to resolve this service from.
    /// Configurable so a deployment can put it on a share that survives a
    /// redeploy; defaults to a folder beside the app so a fresh clone just works.
    /// </summary>
    public static string ResolveRoot(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configured = configuration["Uploads:RootPath"];
        return string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(environment.ContentRootPath, "uploads")
            : configured;
    }

    /// <summary>
    /// Creates the upload folder, reporting failure instead of throwing.
    ///
    /// This used to be part of ResolveRoot and ran during startup, which took the
    /// whole API down with a 500.30 on IIS: the app pool identity has read and
    /// execute on the site folder but not write, so CreateDirectory threw and the
    /// host never came up. A photo folder that cannot be created is a broken
    /// photo feature, not a broken API — the deployment fix is to point
    /// Uploads:RootPath at a writable folder, and until then everything else has
    /// to keep working.
    /// </summary>
    public static bool TryPrepareRoot(string root, out string? error)
    {
        try
        {
            Directory.CreateDirectory(root);
            error = null;
            return true;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException
            or NotSupportedException or ArgumentException)
        {
            error = ex.Message;
            return false;
        }
    }

    public async Task<ServiceResponseDto<string>> SaveImageAsync(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return Fail("Choose a file to upload.");

        if (file.Length > MaxBytes)
            return Fail($"That file is {file.Length / 1024 / 1024.0:0.#} MB. The limit is 2 MB.");

        if (!AllowedTypes.TryGetValue(file.ContentType ?? string.Empty, out var extension))
            return Fail("Only JPG, PNG and WebP images can be uploaded.");

        await using var source = file.OpenReadStream();
        if (!await LooksLikeImageAsync(source, file.ContentType!))
            return Fail("That file is not a valid image.");
        source.Position = 0;

        // The stored name owes nothing to the client's. Sub-foldered by month so
        // a few school years of photos do not land in one directory.
        var month = DateTime.UtcNow.ToString("yyyy-MM");
        var folder = Path.Combine(_root, month);
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(folder, storedName);

        try
        {
            Directory.CreateDirectory(folder);
            await using var target = File.Create(fullPath);
            await source.CopyToAsync(target);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // The path is logged, never returned — it is the server's filesystem.
            // UnauthorizedAccessException is the one to expect on IIS, where the
            // app pool identity often cannot write beside the deployed site.
            _logger.LogError(ex, "Could not write an upload to {Path}", fullPath);
            return Fail("The file could not be saved. Please try again.");
        }

        var url = $"{RequestPath}/{month}/{storedName}";
        return new ServiceResponseDto<string> { Success = true, Data = url };
    }

    /// <summary>
    /// Reads the first bytes and checks them against the signature the declared
    /// type implies. A caller can claim any content type it likes; the bytes are
    /// harder to argue with, and this is what stops an executable arriving
    /// labelled image/png.
    /// </summary>
    private static async Task<bool> LooksLikeImageAsync(Stream stream, string contentType)
    {
        var header = new byte[12];
        int read = await stream.ReadAsync(header.AsMemory(0, header.Length));
        if (read < 12) return false;

        return contentType.ToLowerInvariant() switch
        {
            "image/jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            "image/png" => header[0] == 0x89 && header[1] == 0x50 &&
                           header[2] == 0x4E && header[3] == 0x47,
            // "RIFF" .... "WEBP"
            "image/webp" => header[0] == 0x52 && header[1] == 0x49 &&
                            header[2] == 0x46 && header[3] == 0x46 &&
                            header[8] == 0x57 && header[9] == 0x45 &&
                            header[10] == 0x42 && header[11] == 0x50,
            _ => false,
        };
    }

    private static ServiceResponseDto<string> Fail(string message) =>
        new() { Success = false, Message = message };
}
