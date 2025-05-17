import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dtos/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dtos/signin.dto';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private UserModel: Model<User>) {}
  async signup(signUpData: SignUpDto) {
    const { email, password, name } = signUpData;

    const emailInUse = await this.UserModel.findOne({
      email,
    });

    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.UserModel.create({ name, email, password: hashedPassword });
  }

  async signin(credentials: SignInDto) {
    const { email, password } = credentials;
    const user = await this.UserModel.findOne({
      email,
    });

    if (!user) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong password');
    }

    return {
      message: 'success',
    };
  }
}
