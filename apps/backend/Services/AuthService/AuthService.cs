using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;

namespace transit_display_platform_api.Services.AuthService;

public class AuthService : IAuthService
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenService _tokenService;

    public AuthService(ApplicationDbContext context, IJwtTokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<ServiceResponseDto<LoginResponseModel>> LoginAsync(LoginRequestModel request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return new ServiceResponseDto<LoginResponseModel>
            {
                Success = false,
                Message = "Username and password are required."
            };

        var username = request.Username.Trim();

        var user = await _context.UserMasters
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u =>
                !u.IsDeleted &&
                (u.EmailId == username || u.EmployeeCode == username || u.Contact == username));

        if (user != null && user.LockoutEndsAt.HasValue && user.LockoutEndsAt > DateTime.UtcNow)
            return new ServiceResponseDto<LoginResponseModel>
            {
                Success = false,
                Message = "Account is temporarily locked due to repeated failed logins. Try again later."
            };

        // Same message for missing user and wrong password to avoid user enumeration.
        if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            if (user != null)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= MaxFailedAttempts)
                {
                    user.LockoutEndsAt = DateTime.UtcNow.Add(LockoutDuration);
                    user.FailedLoginAttempts = 0;
                }
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return new ServiceResponseDto<LoginResponseModel>
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        if (!user.IsActive)
            return new ServiceResponseDto<LoginResponseModel>
            {
                Success = false,
                Message = "Account is inactive. Please contact your administrator."
            };

        user.FailedLoginAttempts = 0;
        user.LockoutEndsAt = null;
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var tokens = _tokenService.GenerateToken(user);

        var data = new LoginResponseModel
        {
            Token = tokens.AccessToken,
            TokenExpiresAt = tokens.AccessTokenExpiresAt
        };

        return new ServiceResponseDto<LoginResponseModel>
        {
            Data = data,
            Message = "Login successful."
        };
    }
}
