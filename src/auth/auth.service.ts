import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dtos/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dtos/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh-token.schema';
import * as crypto from 'crypto';
import { ResetToken } from './schemas/reset-token.schema';
import { MailService } from 'src/services/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    @InjectModel(ResetToken.name)
    private ResetTokenModel: Model<ResetToken>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}
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

    // Generate JWT Tokens
    const token = await this.generateUserTokens(
      user._id as mongoose.Types.ObjectId,
    );

    return {
      ...token,
      userId: user._id,
    };
  }

  async changePassword(
    userId: mongoose.Types.ObjectId,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.UserModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found...');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong password');
    }

    //Change user's password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();
  }

  async forgotPassword(email: string) {
    //Check user exists or not

    const user = await this.UserModel.findOne({
      email,
    });

    if (!user) {
      throw new UnauthorizedException('User not exists');
    }

    // If exists, generate password resetlink
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.ResetTokenModel.create({
      token: resetToken,
      userId: user._id,
      expiryDate,
    });

    // Send the link to the user by email
    try {
      await this.mailService.sendPasswordResetEmail(email, resetToken);
    } catch (e) {
      Logger.error((e as Error).message);
      throw new InternalServerErrorException('Failed to send reset email');
    }
  }

  async resetPassword(newPassword: string, resetToken: string) {
    // Find a valid reset token document
    const token = await this.ResetTokenModel.findOne({
      token: resetToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid link');
    }
    // Change user password
    const user = await this.UserModel.findById(token.userId);

    if (!user) {
      throw new InternalServerErrorException();
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await this.ResetTokenModel.deleteOne({ _id: token._id });
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh Token is invalid');
    }
    return this.generateUserTokens(token.userId);
  }

  async generateUserTokens(userId: mongoose.Types.ObjectId) {
    const accessToken = this.jwtService.sign({ userId });
    const refreshToken = crypto.randomUUID();

    await this.storeRefreshToken(refreshToken, userId);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId: mongoose.Types.ObjectId) {
    // Calculate expiry date 3 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.RefreshTokenModel.updateOne(
      { userId },
      { $set: { token, expiryDate } },
      {
        upsert: true,
      },
    );
  }
}
