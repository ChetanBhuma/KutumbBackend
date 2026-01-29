"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const registerController_1 = require("./auth/registerController");
const loginController_1 = require("./auth/loginController");
const otpController_1 = require("./auth/otpController");
const passwordController_1 = require("./auth/passwordController");
const profileController_1 = require("./auth/profileController");
class AuthController {
    static register = registerController_1.RegisterController.register;
    static login = loginController_1.LoginController.login;
    static logout = loginController_1.LoginController.logout;
    static refreshToken = loginController_1.LoginController.refreshToken;
    static sendOTP = otpController_1.OTPController.sendOTP;
    static verifyOTP = otpController_1.OTPController.verifyOTP;
    static forgotPassword = passwordController_1.PasswordController.forgotPassword;
    static resetPassword = passwordController_1.PasswordController.resetPassword;
    static me = profileController_1.ProfileController.me;
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map