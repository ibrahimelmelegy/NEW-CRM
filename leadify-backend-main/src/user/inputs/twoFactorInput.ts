import { IsEmail, IsString, Length } from 'class-validator';

export class TwoFactorCodeInput {
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code!: string;
}

export class ValidateLoginCodeInput {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code!: string;
}
