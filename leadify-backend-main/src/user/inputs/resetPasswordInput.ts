import { IsString, MinLength } from 'class-validator';

export class ResetPasswordInput {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
