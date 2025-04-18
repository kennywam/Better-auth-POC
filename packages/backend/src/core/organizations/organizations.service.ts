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
