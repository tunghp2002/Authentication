import { IsEmail, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
