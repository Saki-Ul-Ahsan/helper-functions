import { BadRequestException } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";
import * as ExcelJS from "exceljs";
import * as os from "os";
import * as crypto from "crypto";

export async function isFileEdited(fileBuffer: Buffer): Promise<{
  isEdited: boolean;
  timeDifferenceInSeconds: number;
}> {
  try {
    const isEditCheckEnabled = process.env.ENABLE_FILE_EDIT_CHECK === "true";
    const threshold = Number(process.env.EDIT_TIME_THRESHOLD_SECONDS || "90");

    if (!isEditCheckEnabled) {
      return {
        isEdited: false,
        timeDifferenceInSeconds: 0,
      };
    }

    const tempFilePath = path.join(
      os.tmpdir(),
      `${crypto.randomBytes(16).toString("hex")}.xlsx`
    );
    await fs.writeFile(tempFilePath, fileBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(tempFilePath);

    const created = workbook.created;
    const modified = workbook.modified;

    let timeDifferenceInSeconds = 0;
    let isEdited = false;

    if (created && modified) {
      timeDifferenceInSeconds =
        (new Date(modified).getTime() - new Date(created).getTime()) / 1000;
      isEdited = timeDifferenceInSeconds > threshold;
    }

    await fs.unlink(tempFilePath);

    return {
      isEdited,
      timeDifferenceInSeconds,
    };
  } catch (error) {
    throw new BadRequestException(
      `Failed to process the file: ${error.message}`
    );
  }
}
