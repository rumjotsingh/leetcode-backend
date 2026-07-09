import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { ROLES } from '../../config/constants';
import { User } from '../users/user.model';
import { RefreshToken } from './refreshToken.model';
import { RegisterInput, LoginInput, GoogleLoginInput } from './auth.schema';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../utils/errors';
import { parseDurationToMs } from '../../utils/helpers';
import { JwtPayload } from '../../middlewares/auth.middleware';
import { userService } from '../users/user.service';

const SALT_ROUNDS = 12;
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshTokenValue(): string {
  return crypto.randomBytes(64).toString('hex');
}

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await User.findOne({
      $or: [{ email: input.email }, { username: input.username }],
    });
    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new ConflictError('Email already registered');
      }
      throw new ConflictError('Username already taken');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await User.create({
      username: input.username,
      email: input.email,
      passwordHash,
      authProvider: 'local',
      role: ROLES.USER,
    });

    const tokens = await this.issueTokens(user._id.toString(), user.role);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.authProvider === 'google' && !user.passwordHash) {
      throw new UnauthorizedError('This account uses Google sign-in. Please log in with Google.');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.issueTokens(user._id.toString(), user.role);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async googleLogin(input: GoogleLoginInput) {
    if (!googleClient || !env.GOOGLE_CLIENT_ID) {
      throw new BadRequestError('Google login is not configured');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: input.idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedError('Invalid Google token');
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      const baseUsername = (payload.name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 20) || 'user';
      const username = await this.generateUniqueUsername(baseUsername);

      user = await User.create({
        username,
        email,
        googleId,
        authProvider: 'google',
        avatar: payload.picture || '',
        role: ROLES.USER,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (payload.picture && !user.avatar) user.avatar = payload.picture;
      await user.save();
    }

    const tokens = await this.issueTokens(user._id.toString(), user.role);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await RefreshToken.deleteOne({ _id: stored._id });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: stored._id });
      throw new UnauthorizedError('User not found');
    }

    await RefreshToken.deleteOne({ _id: stored._id });
    const tokens = await this.issueTokens(user._id.toString(), user.role);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    const stats = await userService.getSolveStats(userId);
    return {
      ...this.sanitizeUser(user),
      ...stats,
    };
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    let username = base;
    let suffix = 0;
    while (await User.exists({ username })) {
      suffix++;
      username = `${base}${suffix}`;
    }
    return username;
  }

  private async issueTokens(userId: string, role: string) {
    const accessToken = generateAccessToken({ userId, role: role as JwtPayload['role'] });
    const refreshToken = generateRefreshTokenValue();
    const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

    await RefreshToken.create({ userId, token: refreshToken, expiresAt });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: InstanceType<typeof User>) {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      authProvider: user.authProvider,
      totalSolved: user.totalSolved,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
