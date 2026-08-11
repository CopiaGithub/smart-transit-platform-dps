import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiError } from './api.types';

/**
 * The single seam between the attach-file UI and wherever files end up living.
 *
 * There is no upload endpoint on the server yet: the API has no IFormFile
 * action, no UseStaticFiles, and no storage provider, and the columns that hold
 * the result (StudentMaster.PhotoUrl, ParentMaster.PhotoUrl) are nvarchar(500) —
 * sized for a path, nowhere near enough for the file itself. So a picked file
 * currently has nowhere to go, and saying so plainly beats a button that looks
 * like it worked.
 *
 * When the endpoint lands, `upload` is the only method that changes: post the
 * file as multipart and return the stored path. DemoDataSeeder already implies
 * the shape — "/uploads/students/{admissionNumber}.jpg".
 */
@Injectable({ providedIn: 'root' })
export class AttachmentService {
  /** True once uploading is wired up; the UI uses this to explain itself. */
  readonly isUploadAvailable = false;

  readonly unavailableMessage =
    'Attaching a file is not available yet — the server has no upload endpoint.';

  /** Resolves to the stored path to write into the record's URL column. */
  upload(_file: File): Observable<string> {
    return throwError(() => new ApiError(501, this.unavailableMessage));
  }
}
