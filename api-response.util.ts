// src/utils/api-response.util.ts
export class ApiResponse {
  static success(
    data: any,
    message: string = "Success",
    statusCode: number = 200
  ) {
    return {
      status: "success",
      statusCode,
      message,
      data,
    };
  }

  static error(message: string, statusCode: number, errors: any[] = []) {
    return {
      status: "error",
      statusCode,
      message,
      errors,
    };
  }
}
