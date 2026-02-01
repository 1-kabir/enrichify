export class LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}
