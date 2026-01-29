import { RegisterController } from './auth/registerController';
import { LoginController } from './auth/loginController';
import { OTPController } from './auth/otpController';
import { PasswordController } from './auth/passwordController';
import { ProfileController } from './auth/profileController';
export declare class AuthController {
    static register: typeof RegisterController.register;
    static login: typeof LoginController.login;
    static logout: typeof LoginController.logout;
    static refreshToken: typeof LoginController.refreshToken;
    static sendOTP: typeof OTPController.sendOTP;
    static verifyOTP: typeof OTPController.verifyOTP;
    static forgotPassword: typeof PasswordController.forgotPassword;
    static resetPassword: typeof PasswordController.resetPassword;
    static me: typeof ProfileController.me;
}
//# sourceMappingURL=authController.d.ts.map