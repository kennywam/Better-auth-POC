import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  create(createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.client.organization.create({
      data: createOrganizationDto,
    });
  }

  /**
   * Create a default organization for a user during registration
   * @param name The name to use for the organization (defaults to user's name + "'s Organization")
   * @returns The created organization
   */
  async createDefaultOrganization(name?: string): Promise<any> {
    const orgName = name ? `${name}'s Organization` : 'Default Organization';
    
    return this.prisma.client.organization.create({
      data: {
        name: orgName,
        description: 'Default organization created during user registration',
      },
    });
  }

  findAll() {
    return this.prisma.client.organization.findMany({
      include: {
        users: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.client.organization.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    return this.prisma.client.organization.update({
      where: {
        id,
      },
      data: updateOrganizationDto,
    });
  }

  remove(id: string) {
    return this.prisma.client.organization.delete({
      where: {
        id,
      },
    });
  }
}
