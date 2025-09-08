import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { AuditLogService } from "src/modules/audit_log/audit_log.service";
import { asyncLocalStorage, setAsyncContext } from "../context/async-context";
import { PermissionsNames } from "config/Permissions/main.permissions";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;
    const ip = request.ip;
    // console.log('Request: ', request.user, request['user']);

    const transactionId =
      request.headers["x-transaction-id"]?.toString() || null;
    const referenceId = request.headers["x-reference-id"]?.toString() || null;

    return asyncLocalStorage.run(new Map(), () => {
      setAsyncContext("transaction_id", transactionId);
      setAsyncContext("reference_id", referenceId);

      const actionName = this.reflector.getAllAndOverride<string>("routeName", [
        context.getHandler(),
      ]);
      const moduleName = this.reflector.getAllAndOverride<string>("routeName", [
        context.getClass(),
      ]);

      let module = moduleName || "unknown_module";
      let action = actionName || "unknown_action";
      let brief = null;
      // console.log(`Module: ${module}, Action: ${actionName}, Brief: ${brief}`);

      if (actionName && moduleName) {
        const modulePermissions = PermissionsNames[moduleName];
        if (modulePermissions && typeof modulePermissions === "object") {
          const matchedPerm = Object.values(modulePermissions).find(
            (perm: any) => perm.name === actionName
          );

          if (matchedPerm) {
            action = actionName;
            brief = (matchedPerm as any).brief || null;
          } else {
            // console.warn(
            //   `No permission found for action '${actionName}' in module '${moduleName}'`,
            // );
          }
        } else {
          // console.warn(`No permissions defined for module '${moduleName}'`);
        }
      } else {
        if (!moduleName) {
          // console.warn('No moduleName defined at controller level');
        }
        if (!actionName) {
          // console.warn('No routeName defined at method level');
        }
      }

      const store = asyncLocalStorage.getStore();
      const transaction_id = store?.get("transaction_id") || null;
      const reference_id = store?.get("reference_id") || null;

      const auditLogData = {
        user_id: user?.id,
        ip,
        module,
        action: brief,
        key: action,
        transaction_id,
        reference_id,
        details: brief,
        response_status: null as number | null,
        error_details: null as string | null,
        employee_id: user?.employee_id,
      };

      return next.handle().pipe(
        tap(() => {
          if (auditLogData.module === "auth" && auditLogData.key === "login") {
            return;
          }
          auditLogData.response_status = response.statusCode || 200;
          this.auditLogService
            .auditlogAction(auditLogData)
            .catch((error) =>
              console.error("Audit log failed:", error.message)
            );
        }),
        catchError((error) => {
          const status =
            error instanceof HttpException ? error.getStatus() : 500;

          auditLogData.response_status = status;

          // Only populate error_details if the response status is >= 400
          if (status >= 400) {
            auditLogData.error_details = error.message;
            //     error instanceof HttpException
            //       ? JSON.stringify({
            //         message: error.message,
            //         cause: error.cause,
            //         response: error.getResponse(),
            //       })
            //       : JSON.stringify({
            //         message: error.message,
            //         stack: error.stack,
            //       });
            // }
          }
          if (auditLogData.module !== "auth" || auditLogData.key !== "login") {
            this.auditLogService
              .auditlogAction(auditLogData)
              .catch((error) =>
                console.error("Audit log failed:", error.message)
              );
          }
          return throwError(() => error);
        })
      );
    });
  }
}
