import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

/**
 * The single seam between the attach-file UI and wherever files end up living.
 *
 * The server stores the file and answers with the path to serve it from
 * (`/uploads/2026-08/{guid}.jpg`); that string is what goes into the record's
 * URL column — StudentMaster.PhotoUrl or ParentMaster.PhotoUrl, both
 * nvarchar(500), sized for a path and nowhere near enough for a file.
 *
 * The upload is a separate round trip from the save, which means a picked file
 * that is never saved leaves an orphaned file on disk. That is the right way
 * round: the alternative is posting the image inside the record payload, where
 * a rejected save would take the photo with it and a 2 MB body would have to
 * pass every validation rule on the form.
 */
@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly api = inject(ApiService);

  /** True once uploading is wired up; the UI uses this to explain itself. */
  readonly isUploadAvailable = true;

  readonly unavailableMessage =
    'Attaching a file is not available yet — the server has no upload endpoint.';

  /**
   * Resolves to the stored path to write into the record's URL column.
   *
   * Sent as FormData so Angular sets the multipart boundary itself — setting a
   * Content-Type by hand here produces a boundary the server cannot parse.
   * The field name must stay `file`: it is what binds to the controller's
   * IFormFile parameter.
   */
  upload(file: File): Observable<string> {
    const body = new FormData();
    body.append('file', file, file.name);

    return this.api.post<string>('/Attachment/upload', body);
  }

  /**
   * Turns a stored path into something an `<img src>` can actually load.
   *
   * What the record holds is API-relative — "/uploads/2026-08/{guid}.jpg" — and
   * the web app is not served from the API's origin. In development it is
   * localhost:4200 against localhost:5199, and in the hosted DEV environment the
   * API lives under a /tdpdevapi sub-application. Either way, dropping the raw
   * path into an img tag resolves it against the *app's* origin and 404s, which
   * is what made saved photos render as a broken-image placeholder.
   *
   * The base is derived from apiUrl by dropping its trailing "/api", which is
   * correct for both shapes the environments use:
   *   http://localhost:5199/api            -> http://localhost:5199
   *   https://host/tdpdevapi/api           -> https://host/tdpdevapi
   *
   * Absolute URLs and inline data/blob previews are handed back untouched, so
   * this is safe to call on any value the control might hold.
   */
  resolveUrl(stored: string | null | undefined): string | null {
    const path = (stored ?? '').trim();
    if (!path) {
      return null;
    }

    if (/^(https?:|data:|blob:)/i.test(path)) {
      return path;
    }

    const base = environment.apiUrl.replace(/\/api\/?$/i, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
  }
}
