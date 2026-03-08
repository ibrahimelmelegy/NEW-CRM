import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password!: string;

  @IsString()
  workspaceName!: string;

  @IsString()
  @MinLength(2)
  userName!: string;
}
