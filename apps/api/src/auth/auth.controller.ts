import { Controller, Post, Get, Body, Request, UseGuards, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users')
  getAllUsers() {
    return this.authService.getAllUsers();
  }

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Patch('users/:id/role')
updateRole(@Param('id') id: string, @Body() body: { role: string }, @Request() req) {
  return this.authService.updateRole(id, body.role, req.user.sub);
}
}