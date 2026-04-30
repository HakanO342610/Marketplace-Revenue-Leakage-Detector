import { IsString, Length } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @Length(2, 80)
  name!: string;
}
