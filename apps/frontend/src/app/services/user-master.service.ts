import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/** Stub — replace with real user API later. */
@Injectable({ providedIn: 'root' })
export class UserMasterService {
  getUserById(_id: number): Observable<{ success: boolean; data?: any }> {
    return of({ success: true, data: { profilePic: null } });
  }

  getUserMasterlist(_type: string, _params: any = {}): Observable<any[]> {
    return of([]);
  }
}
