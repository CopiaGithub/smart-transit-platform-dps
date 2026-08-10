import { Observable } from 'rxjs';
import { ApiService, QueryParams } from './api.service';
import { PagedResult } from './api.types';

/**
 * Every master controller on this backend was generated from the same template,
 * so one factory covers all of them:
 *
 *   list    GET    /api/{Resource}       -> PagedResult<T>
 *   byId    GET    /api/{Resource}/{id}  -> T
 *   create  POST   /api/{Resource}       -> T
 *   update  PATCH  /api/{Resource}/{id}  -> true
 *   remove  DELETE /api/{Resource}/{id}  -> true   (soft delete: IsDeleted = true)
 *
 * The Angular analogue of `crud()` in apps/mobile/src/api/masters.api.ts.
 */
export interface CrudApi<TList, TCreate = unknown, TUpdate = unknown> {
  list(query?: QueryParams): Observable<PagedResult<TList>>;
  byId(id: number): Observable<TList>;
  create(body: TCreate): Observable<TList>;
  update(id: number, body: TUpdate): Observable<boolean>;
  remove(id: number): Observable<boolean>;
}

export function createCrudApi<TList, TCreate = unknown, TUpdate = unknown>(
  api: ApiService,
  resource: string,
): CrudApi<TList, TCreate, TUpdate> {
  return {
    list: (query) => api.get<PagedResult<TList>>(`/${resource}`, query),
    byId: (id) => api.get<TList>(`/${resource}/${id}`),
    create: (body) => api.post<TList>(`/${resource}`, body),
    update: (id, body) => api.patch<boolean>(`/${resource}/${id}`, body),
    remove: (id) => api.delete<boolean>(`/${resource}/${id}`),
  };
}
