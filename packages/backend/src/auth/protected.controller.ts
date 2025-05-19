import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/protected')
@UseGuards(AuthGuard)
export class ProtectedController {
  constructor(private readonly prisma: PrismaService) {}
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
  
  @Get('organization')
  async getUserOrganization(@CurrentUser() user: any) {
    try {
      if (!user || !user.id) {
        return { error: 'User not found' };
      }
      
      // Get the user with their organization
      const userData = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { organization: true },
      });
      
      if (!userData || !userData.organization) {
        return { error: 'Organization not found' };
      }
      
      return userData.organization;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return { error: 'Failed to fetch organization data' };
    }
  }
}
