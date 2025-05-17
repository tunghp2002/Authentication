import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/signup.dto';
import { SignInDto } from './dtos/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpData: SignUpDto) {
    return this.authService.signup(signUpData);
  }

  @Post('signIn')
  async signIn(@Body() credentials: SignInDto) {
    return this.authService.signin(credentials);
  }
}
