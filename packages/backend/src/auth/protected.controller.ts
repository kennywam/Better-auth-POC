import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('api/protected')
@UseGuards(AuthGuard)
export class ProtectedController {
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'This is a protected route',
      user,
    };
  }

  @Get('data')
  getProtectedData() {
    return {
      message: 'This is protected data',
      data: {
        items: [
          { id: 1, name: 'Protected Item 1' },
          { id: 2, name: 'Protected Item 2' },
          { id: 3, name: 'Protected Item 3' },
        ],
      },
    };
  }
}
