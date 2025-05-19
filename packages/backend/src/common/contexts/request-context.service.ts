import { Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable({ scope: Scope.DEFAULT })
export class RequestContextService {
  private readonly requestStorage = new AsyncLocalStorage<Request>();

  run(req: Request, callback: () => any) {
    return this.requestStorage.run(req, callback);
  }

  getCurrentRequest(): Request | undefined {
    return this.requestStorage.getStore();
  }
}
