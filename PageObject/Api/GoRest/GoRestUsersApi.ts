import { CrudApi } from '../CrudApi';

export class GoRestUsersApi extends CrudApi {
  protected readonly resourcePath = '/public/v2/users';
}
