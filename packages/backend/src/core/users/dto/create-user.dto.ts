import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class CreateUserDto {
  @IsString()
  @ApiProperty()
  name: string
  @IsString()
  @ApiProperty()
  email: string
  @IsString()
  @ApiProperty()
  @IsOptional()
  image?: string
  @IsString()
  @ApiProperty()
  organizationId: string
}
