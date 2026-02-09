import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from './auth.middleware';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      profile_image?: Express.Multer.File[];
    };
    const user = await authService.register(req.body, files);
    res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        access_token: result.access_token,
        expires_in: result.expires_in,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        access_token: result.access_token,
        expires_in: result.expires_in,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    res.clearCookie('refresh_token');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    await authService.changePassword(req.user?.id ?? '', current_password, new_password);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);

    res.json({
      success: true,
      message: 'Password reset instructions sent to email',
    });
  } catch {
    // Don't reveal if user exists
    res.json({
      success: true,
      message: 'If the email exists, reset instructions will be sent',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
