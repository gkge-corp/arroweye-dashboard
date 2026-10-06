import { NextResponse, type NextRequest } from "next/server";

import {
  findLatestRadioMonitor,
  getRadioMonitorDownloadUrl,
} from "@/lib/storage/r2";
import { verifyRadioMonitorLink } from "@/lib/storage/report-link";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  if (
    !verifyRadioMonitorLink(
      Number(searchParams.get("exp")),
      searchParams.get("sig") ?? "",
    )
  ) {
    return new NextResponse("This download link is invalid or has expired.", {
      status: 410,
    });
  }

  try {
    const file = await findLatestRadioMonitor();
    if (!file) {
      return new NextResponse("The file is no longer available.", {
        status: 404,
      });
    }
    return NextResponse.redirect(await getRadioMonitorDownloadUrl(file));
  } catch (error) {
    console.error("Radio monitor download failed:", error);
    return new NextResponse("The file could not be downloaded.", {
      status: 500,
    });
  }
}
