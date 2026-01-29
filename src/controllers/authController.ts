import { RegisterController } from './auth/registerController';
import { LoginController } from './auth/loginController';
import { OTPController } from './auth/otpController';
import { PasswordController } from './auth/passwordController';
import { ProfileController } from './auth/profileController';

export class AuthController {
    static register = RegisterController.register;
    static login = LoginController.login;
    static logout = LoginController.logout;
    static refreshToken = LoginController.refreshToken;
    static sendOTP = OTPController.sendOTP;
    static verifyOTP = OTPController.verifyOTP;
    static forgotPassword = PasswordController.forgotPassword;
    static resetPassword = PasswordController.resetPassword;
    static me = ProfileController.me;
}
