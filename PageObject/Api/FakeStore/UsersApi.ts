import { CrudApi } from '../CrudApi';

export class UsersApi extends CrudApi {
  protected readonly resourcePath = '/users';
}
