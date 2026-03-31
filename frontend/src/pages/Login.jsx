import "./Login.css";
import api from '../utils/api'


import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles, ShieldCheck, Users, Briefcase } from 'lucide-react'


const Login = () => {
  const [step, setStep] = useState(1) // 1: credentials, 2: OTP
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: '' // 'user', 'ngo', or 'agent'
  })
  const [otpData, setOtpData] = useState({
    userId: '',
    otp: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtpData({ ...otpData, otp: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
        const response = await api.post('/auth/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        userType: formData.userType
      })

      const data = response.data

      if (data.success) {
        if (data.requiresOTP) {
          // Move to OTP step
          setOtpData({ ...otpData, userId: data.userId })
          setStep(2)
          toast.success('OTP sent to your email!')
        } else {
          // Admin login without OTP
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // Update axios defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          toast.success('Welcome back Admin!', { icon: '👑' })
          // Force page reload to trigger AuthContext initialization
          window.location.href = '/dashboard'
        }
      } else {
        // Show specific message for missing account type
        if (data.message && data.message.includes('account type')) {
          toast.error('Please select your account type (User, NGO, or Volunteer)')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    
    if (otpData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/verify-login-otp', otpData)
      const data = response.data

      if (data.success) {
        // Update localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Update axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        
        // Force page reload to trigger AuthContext initialization
        toast.success('Welcome back!', { icon: '🎉' })
        window.location.href = '/dashboard'
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  const handleResendOTP = async () => {
    setLoading(true)

    try {
      const response = await api.post('/auth/resend-otp', {
      userId: otpData.userId,
      purpose: 'login'
      })
      const data = response.data
      

      if (data.success) {
        toast.success('OTP resent successfully!')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to resend OTP')
    }

    setLoading(false)
  }

  return (
    <div className="login-aurora min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full relative">
        {/* Glass Morphism Card */}
        <div className="login-glass-card rounded-3xl p-8 relative overflow-hidden">

          {/* Decorative Corner Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/20 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-tr-full"></div>
          
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="inline-block">
              <div className="text-6xl mb-4 animate-bounce-slow filter drop-shadow-lg">♻️</div>
              <Sparkles className="absolute top-0 right-0 w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              WasteZero
            </h1>
            <p className="text-gray-600 font-medium">
              {step === 1 ? 'Welcome back! Ready to make a difference?' : 'Verify your email'}
            </p>
          </div>

          {/* Step 1: Login Form */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  I am a
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select your account type (Admin users can skip this)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: 'user' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      formData.userType === 'user'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <Users className="w-8 h-8 mb-2" />
                    <span className="font-semibold">User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: 'ngo' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      formData.userType === 'ngo'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <ShieldCheck className="w-8 h-8 mb-2" />
                    <span className="font-semibold">NGO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: 'agent' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      formData.userType === 'agent'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <Briefcase className="w-8 h-8 mb-2" />
                    <span className="font-semibold">Volunteer</span>
                  </button>
                </div>
              </div>

              {/* Email Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-primary-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all group-focus-within:text-primary-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-primary-600">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all group-focus-within:text-primary-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full frosted-btn font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2"

              >
                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span className="relative">Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 relative" />
                    <span className="relative">Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-gray-600">
                  We've sent a 6-digit code to<br />
                  <span className="font-semibold text-gray-900">{formData.email}</span>
                </p>
              </div>

              {/* OTP Input */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={otpData.otp}
                  onChange={handleOTPChange}
                  className="w-full px-4 py-4 text-center text-3xl font-bold tracking-widest bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-gray-900"
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otpData.otp.length !== 6}
                className="w-full bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Didn't receive the code? Resend OTP
                </button>
              </div>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-600 hover:text-gray-800 font-semibold py-2 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          )}

          {/* Divider */}
          {step === 1 && (
            <>
              <div className="mt-8 mb-6 flex items-center">
                <div className="flex-1 border-t-2 border-gray-200"></div>
                <span className="px-4 text-sm text-gray-500 font-medium">or</span>
                <div className="flex-1 border-t-2 border-gray-200"></div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  New to WasteZero?{' '}
                  <Link 
                    to="/register" 
                    className="font-bold text-primary-600 hover:text-primary-700 transition-colors relative group inline-block"
                  >
                    Create an account
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Bottom Decorative Text */}
        <p className="text-center mt-6 text-sm text-gray-600 font-medium">
          Join the movement for a cleaner tomorrow 🌍
        </p>
      </div>
    </div>
  )
}

export default Login
