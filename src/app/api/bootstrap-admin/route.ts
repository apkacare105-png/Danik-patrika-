import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const secret = body.secret;

    if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const adminEmail = "apkacare105@gmail.com";

    const { data: users, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    const user = users.users.find(
      (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: "Admin user does not exist in Supabase Auth." },
        { status: 404 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin role assigned successfully.",
      email: adminEmail,
      role: "admin",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}