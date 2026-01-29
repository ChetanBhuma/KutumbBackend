"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.verifyRefreshToken = exports.resetPassword = exports.forgotPassword = exports.loginCitizen = exports.registerCitizen = exports.verifyOTP = exports.requestOTP = exports.checkRegistration = exports.sendOTP = exports.generateOTP = void 0;
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const tokenService_1 = require("./tokenService");
const db = database_1.prisma;
/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
    // For testing/demo purposes, return fixed OTP
    return '000000';
    // return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
/**
 * Send OTP via SMS
 * TODO: Integrate with actual SMS gateway (Twilio, AWS SNS, etc.)
 */
const sendOTP = async (mobileNumber, otp) => {
    try {
        // TODO: Replace with actual SMS gateway integration
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[OTP Service] Sending OTP ${otp} to ${mobileNumber}`);
        }
        // Simulated SMS sending
        // In production, use:
        // await twilioClient.messages.create({
        //   body: `Your Delhi Police Senior Citizen Portal OTP is: ${otp}. Valid for 10 minutes.`,
        //   to: mobileNumber,
        //   from: config.sms.fromNumber
        // });
        return true;
    }
    catch (error) {
        console.error('Failed to send OTP:', error);
        return false;
    }
};
exports.sendOTP = sendOTP;
/**
 * Check if mobile number is registered
 */
const checkRegistration = async (mobileNumber) => {
    try {
        // Check if linked in Auth
        const auth = await db.citizenAuth.findUnique({
            where: { mobileNumber }
        });
        if (auth && auth.citizenId) {
            return { isRegistered: true };
        }
        // Fallback: Check if mobile exists in SeniorCitizen registry
        const digits = mobileNumber.replace(/\D/g, '').slice(-10);
        const formats = [digits, `+91${digits}`]; // Check both 10-digit and +91 format
        const citizen = await db.seniorCitizen.findFirst({
            where: {
                mobileNumber: { in: formats }
            }
        });
        return { isRegistered: !!citizen };
    }
    catch (error) {
        console.error('Error checking registration:', error);
        // Return false on error to be safe
        return { isRegistered: false };
    }
};
exports.checkRegistration = checkRegistration;
/**
 * Request OTP for mobile number
 */
/**
 * Request OTP for mobile number
 */
const requestOTP = async (mobileNumber, requireRegistered = false) => {
    try {
        // Check rate limiting and existence
        const auth = await db.citizenAuth.findUnique({
            where: { mobileNumber }
        });
        if (requireRegistered) {
            let isRegistered = false;
            // Check if linked in Auth
            if (auth && auth.citizenId) {
                isRegistered = true;
            }
            else {
                // Fallback: Check if mobile exists in SeniorCitizen registry
                // This handles cases where profile exists but auth record doesn't (or isn't linked)
                const digits = mobileNumber.replace(/\D/g, '').slice(-10);
                const formats = [digits, `+91${digits}`]; // Check both 10-digit and +91 format
                const citizen = await db.seniorCitizen.findFirst({
                    where: {
                        mobileNumber: { in: formats }
                    }
                });
                if (citizen) {
                    isRegistered = true;
                    // Auto-link found citizen to this auth attempt if not linked
                    if (auth && !auth.citizenId) {
                        await db.citizenAuth.update({
                            where: { id: auth.id },
                            data: { citizenId: citizen.id }
                        });
                    }
                }
            }
            if (!isRegistered) {
                return {
                    success: false,
                    message: 'Mobile number not registered. Please register first.'
                };
            }
        }
        if (auth?.otpLastSentAt) {
            const timeSinceLastOTP = Date.now() - auth.otpLastSentAt.getTime();
            const minInterval = 0; // Disabled for testing
            if (timeSinceLastOTP < minInterval) {
                const waitTime = Math.ceil((minInterval - timeSinceLastOTP) / 1000);
                return {
                    success: false,
                    message: `Please wait ${waitTime} seconds before requesting another OTP`
                };
            }
        }
        // Check daily limit (max 10 OTPs per day)
        if (auth?.otpAttempts && auth.otpAttempts >= 10) {
            const lastAttempt = auth.otpLastSentAt || new Date();
            const hoursSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastAttempt < 24) {
                return {
                    success: false,
                    message: 'Daily OTP limit exceeded. Please try again tomorrow.'
                };
            }
        }
        // Generate and save OTP
        const otp = (0, exports.generateOTP)();
        console.log('\n' + '='.repeat(60));
        console.log(`🔐 OTP GENERATED FOR CITIZEN LOGIN`);
        console.log(`📱 Mobile: ${mobileNumber}`);
        console.log(`⏰ Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString()}`);
        console.log('='.repeat(60) + '\n');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // For requestOTP, if we are creating a new record, use normalized +91 format if it looks like a 10 digit Indian number
        if (/^\d{10}$/.test(mobileNumber)) {
            // Logic: Check if +91 version exists first to avoid dupes?
            // Actually requestOTP uses 'upsert' on 'mobileNumber'.
            // If we change 'mobileNumber' here to +91..., we might duplicate if 10-digit already exists.
            // But we want to prefer +91.
            // Let's NOT change 'mobileNumber' argument for the upsert key to avoid confusion,
            // UNLESS we are sure. To be safe, let's stick to what was passed,
            // BUT we rely on the 'link' logic above to fix relationships.
        }
        await db.citizenAuth.upsert({
            where: { mobileNumber },
            create: {
                mobileNumber,
                password: '', // Will be set during registration
                otpCode: otp,
                otpExpiresAt: expiresAt,
                otpAttempts: 1,
                otpLastSentAt: new Date(),
                // Try to link immediately if we found a citizen in the check above (requires fetching again or restructuring)
                // Simplified: The update block above handles 'auth' existing. If auth doesn't exist, we are in 'create'.
                // If we found 'citizen' above (isRegistered=true), we should link it here.
            },
            update: {
                otpCode: otp,
                otpExpiresAt: expiresAt,
                otpAttempts: { increment: 1 },
                otpLastSentAt: new Date()
            }
        });
        // Re-fetch to link if it was a fresh create and we have a citizen match
        if (requireRegistered) {
            const digits = mobileNumber.replace(/\D/g, '').slice(-10);
            const formats = [digits, `+91${digits}`];
            const citizen = await db.seniorCitizen.findFirst({ where: { mobileNumber: { in: formats } } });
            if (citizen) {
                await db.citizenAuth.update({
                    where: { mobileNumber },
                    data: { citizenId: citizen.id }
                });
            }
        }
        // Send OTP
        const sent = await (0, exports.sendOTP)(mobileNumber, otp);
        if (!sent) {
            return {
                success: false,
                message: 'Failed to send OTP. Please try again.'
            };
        }
        return {
            success: true,
            message: 'OTP sent successfully',
            expiresAt,
            otp
        };
    }
    catch (error) {
        console.error('Error requesting OTP:', error);
        return {
            success: false,
            message: 'Failed to send OTP'
        };
    }
};
exports.requestOTP = requestOTP;
/**
 * Verify OTP
 */
/**
 * Verify OTP and login
 */
const verifyOTP = async (mobileNumber, otp) => {
    try {
        const auth = await db.citizenAuth.findUnique({
            where: { mobileNumber },
            include: {
                citizen: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            }
        });
        if (!auth || !auth.otpCode || !auth.otpExpiresAt) {
            console.log(`[VerifyOTP] Failed: No OTP found for ${mobileNumber}. Auth exists: ${!!auth}, OTP exists: ${!!auth?.otpCode}`);
            return {
                success: false,
                message: 'No OTP found. Please request a new one.'
            };
        }
        // Check expiry
        if (new Date() > auth.otpExpiresAt) {
            console.log(`[VerifyOTP] Failed: OTP expired for ${mobileNumber}. Expires: ${auth.otpExpiresAt}, Now: ${new Date()}`);
            return {
                success: false,
                message: 'OTP has expired. Please request a new one.'
            };
        }
        // Check verification attempts to prevent brute force
        const MAX_VERIFICATION_ATTEMPTS = 3;
        if (auth.otpVerificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
            console.log(`[VerifyOTP] Failed: Max verification attempts reached for ${mobileNumber}`);
            // Clear OTP to force new request
            await db.citizenAuth.update({
                where: { mobileNumber },
                data: {
                    otpCode: null,
                    otpExpiresAt: null,
                    otpVerificationAttempts: 0
                }
            });
            return {
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.'
            };
        }
        // Verify OTP
        if (auth.otpCode !== otp) {
            console.log(`[VerifyOTP] Failed: Invalid OTP for ${mobileNumber}. Expected: ${auth.otpCode}, Received: ${otp}`);
            // Increment verification attempts
            await db.citizenAuth.update({
                where: { mobileNumber },
                data: {
                    otpVerificationAttempts: { increment: 1 }
                }
            });
            return {
                success: false,
                message: 'Invalid OTP'
            };
        }
        // Mark as verified and clear OTP
        // Generate tokens
        const tokenPayload = {
            userId: auth.id, // Map id to userId for TokenService compatibility
            email: auth.mobileNumber, // Use mobile as email/identifier
            role: 'CITIZEN',
            citizenId: auth.citizenId || undefined
        };
        const { accessToken, refreshToken } = tokenService_1.TokenService.generateTokenPair(tokenPayload);
        await db.citizenAuth.update({
            where: { mobileNumber },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpiresAt: null,
                otpAttempts: 0,
                otpVerificationAttempts: 0, // Reset verification attempts
                lastLoginAt: new Date(),
                refreshToken,
                refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        // Safe citizen return
        const citizenData = auth.citizen
            ? auth.citizen
            : (auth.citizenId ? await db.seniorCitizen.findUnique({ where: { id: auth.citizenId } }) : null);
        return {
            success: true,
            message: 'Mobile number verified successfully',
            accessToken,
            refreshToken,
            citizen: citizenData
        };
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        return {
            success: false,
            message: 'Failed to verify OTP'
        };
    }
};
exports.verifyOTP = verifyOTP;
/**
 * Register citizen with password
 */
const registerCitizen = async (mobileNumber, password) => {
    try {
        const auth = await db.citizenAuth.findUnique({
            where: { mobileNumber }
        });
        if (!auth) {
            return {
                success: false,
                message: 'Mobile number not found. Please verify your number first.'
            };
        }
        if (!auth.isVerified) {
            return {
                success: false,
                message: 'Mobile number not verified. Please verify OTP first.'
            };
        }
        if (auth.password) {
            return {
                success: false,
                message: 'Account already exists. Please login.'
            };
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Update with password
        const updatedAuth = await db.citizenAuth.update({
            where: { mobileNumber },
            data: {
                password: hashedPassword,
                registrationStep: 1 // Ready for profile completion
            }
        });
        // Check if SeniorCitizen exists with this mobile number and link if so
        if (!updatedAuth.citizenId) {
            const existingCitizen = await db.seniorCitizen.findFirst({
                where: { mobileNumber }
            });
            if (existingCitizen) {
                await db.citizenAuth.update({
                    where: { mobileNumber },
                    data: {
                        citizenId: existingCitizen.id,
                        registrationStep: 2 // Mark as completed
                    }
                });
                return {
                    success: true,
                    message: 'Registration successful. Your existing profile has been linked.'
                };
            }
        }
        return {
            success: true,
            message: 'Registration successful. Please complete your profile.'
        };
    }
    catch (error) {
        console.error('Error registering citizen:', error);
        return {
            success: false,
            message: 'Registration failed'
        };
    }
};
exports.registerCitizen = registerCitizen;
/**
 * Login citizen
 */
const loginCitizen = async (mobileNumber, password, ipAddress) => {
    try {
        console.log(`[LoginDebug] Attempting login for: ${mobileNumber}`);
        let auth = await db.citizenAuth.findUnique({
            where: { mobileNumber },
            include: {
                citizen: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            }
        });
        // Fallback: If not found, try alternative formats
        if (!auth) {
            console.log(`[LoginDebug] Not found with ${mobileNumber}. Trying alternatives.`);
            // If has +91, try without
            if (mobileNumber.startsWith('+91')) {
                const alt = mobileNumber.slice(3);
                console.log(`[LoginDebug] Trying ${alt}`);
                auth = await db.citizenAuth.findUnique({
                    where: { mobileNumber: alt },
                    include: { citizen: { select: { id: true, fullName: true } } }
                });
            }
            // If 10 digits, try with +91
            else if (/^\d{10}$/.test(mobileNumber)) {
                const alt = `+91${mobileNumber}`;
                console.log(`[LoginDebug] Trying ${alt}`);
                auth = await db.citizenAuth.findUnique({
                    where: { mobileNumber: alt },
                    include: { citizen: { select: { id: true, fullName: true } } }
                });
            }
        }
        if (!auth) {
            console.log(`[LoginDebug] User not found after all attempts.`);
            return {
                success: false,
                message: 'Account not found'
            };
        }
        console.log(`[LoginDebug] User found: ${auth.mobileNumber}, Locked: ${auth.lockedUntil}`);
        // Check if account is locked
        if (auth.lockedUntil && new Date() < auth.lockedUntil) {
            return {
                success: false,
                message: 'Account is locked. Please try again later.'
            };
        }
        // Verify password
        const isValid = await bcryptjs_1.default.compare(password, auth.password);
        console.log(`[LoginDebug] Password valid: ${isValid}`);
        if (!isValid) {
            // Increment login attempts
            const attempts = auth.loginAttempts + 1;
            const lockedUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 min
            await db.citizenAuth.update({
                where: { mobileNumber: auth.mobileNumber }, // Use found mobile number
                data: {
                    loginAttempts: attempts,
                    lockedUntil
                }
            });
            return {
                success: false,
                message: attempts >= 5
                    ? 'Account locked due to multiple failed attempts'
                    : 'Invalid password'
            };
        }
        // Generate tokens
        const tokenPayload = {
            userId: auth.id,
            email: auth.mobileNumber,
            role: 'CITIZEN',
            citizenId: auth.citizenId || undefined
        };
        const { accessToken, refreshToken } = tokenService_1.TokenService.generateTokenPair(tokenPayload);
        // Update login info
        await db.citizenAuth.update({
            where: { mobileNumber: auth.mobileNumber },
            data: {
                loginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                lastLoginIP: ipAddress,
                refreshToken,
                refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        return {
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            citizen: auth.citizen
        };
    }
    catch (error) {
        console.error('Error logging in citizen:', error);
        return {
            success: false,
            message: 'Login failed'
        };
    }
};
exports.loginCitizen = loginCitizen;
/**
 * Forgot password - send OTP
 */
const forgotPassword = async (mobileNumber) => {
    const auth = await db.citizenAuth.findUnique({
        where: { mobileNumber }
    });
    if (!auth) {
        return {
            success: false,
            message: 'Account not found'
        };
    }
    return await (0, exports.requestOTP)(mobileNumber);
};
exports.forgotPassword = forgotPassword;
/**
 * Reset password with OTP
 */
const resetPassword = async (mobileNumber, otp, newPassword) => {
    // Verify OTP first
    const otpResult = await (0, exports.verifyOTP)(mobileNumber, otp);
    if (!otpResult.success) {
        return {
            success: false,
            message: otpResult.message
        };
    }
    // Hash new password
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    // Update password
    await db.citizenAuth.update({
        where: { mobileNumber },
        data: {
            password: hashedPassword,
            loginAttempts: 0,
            lockedUntil: null
        }
    });
    return {
        success: true,
        message: 'Password reset successful'
    };
};
exports.resetPassword = resetPassword;
/**
 * Verify refresh token and generate new tokens
 */
const verifyRefreshToken = async (refreshToken) => {
    try {
        // Verify the refresh token
        const payload = tokenService_1.TokenService.verifyRefreshToken(refreshToken);
        // Find the auth record
        const auth = await db.citizenAuth.findUnique({
            where: { id: payload.userId },
            include: { citizen: true }
        });
        if (!auth || auth.refreshToken !== refreshToken) {
            return {
                success: false,
                message: 'Invalid refresh token'
            };
        }
        // Check if refresh token is expired
        if (auth.refreshTokenExpiresAt && new Date() > auth.refreshTokenExpiresAt) {
            return {
                success: false,
                message: 'Refresh token expired'
            };
        }
        // Generate new tokens
        const tokenPayload = {
            userId: auth.id,
            email: auth.mobileNumber,
            role: 'CITIZEN',
            citizenId: auth.citizenId || undefined
        };
        const { accessToken, refreshToken: newRefreshToken } = tokenService_1.TokenService.generateTokenPair(tokenPayload);
        // Update refresh token in database
        await db.citizenAuth.update({
            where: { id: auth.id },
            data: {
                refreshToken: newRefreshToken,
                refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        return {
            success: true,
            message: 'Refresh token regenerated',
            accessToken,
            refreshToken: newRefreshToken,
            userId: auth.id || undefined
        };
    }
    catch (error) {
        console.error('Refresh token error:', error);
        return {
            success: false,
            message: 'Internal server error while refreshing token'
        };
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Logout citizen by clearing refresh token
 */
const logout = async (mobileNumber) => {
    try {
        await db.citizenAuth.update({
            where: { mobileNumber },
            data: {
                refreshToken: null,
                refreshTokenExpiresAt: null
            }
        });
        return true;
    }
    catch (error) {
        console.error('Logout error:', error);
        return false;
    }
};
exports.logout = logout;
//# sourceMappingURL=citizenAuthService.js.map