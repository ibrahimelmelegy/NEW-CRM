import { Expose } from 'class-transformer';
import { IsEmail, IsOptional } from 'class-validator';
import { IsNotBlank } from '../../utils/custom-validators/not-bank.validator';

export class CreateOrUpdateSettingInput {
  // @Expose()
  // @IsOptional()
  // @IsNotBlank()
  // public secretKey?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public emailApiKey?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public name?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  @IsEmail()
  public email?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public logo?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public favIcon?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public primaryColor?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public secondaryColor?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public accentColor?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public fontFamily?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public companyAddress?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public companyPhone?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public companyTaxId?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public brandFooterText?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public companyWebsite?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public invoicePrefix?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public quotePrefix?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public defaultCurrency?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public defaultLanguage?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public dateFormat?: string;

  @Expose()
  @IsOptional()
  @IsNotBlank()
  public timezone?: string;
}
