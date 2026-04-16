import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

type MarvelPayload = {
  title?: string;
  tag?: string;
  location?: string;
  client?: string;
  duration?: string;
  description?: string;
  img?: string;
};

const COLLECTION = "architectural_marvels";
const MAX_LIMIT = 100;
const MAX_BASE64_BYTES = 6 * 1024 * 1024;
const MAX_ADMIN_LIMIT = 50;

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function ensureString(value: unknown) {
  return String(value ?? "").trim();
}

function getDataUrlBytes(dataUrl: string) {
  const payload = dataUrl.split(",")[1] ?? "";
  const normalized = payload.replace(/\s/g, "");
  return Math.floor((normalized.length * 3) / 4);
}

function validateMarvelPayload(payload: MarvelPayload) {
  const normalized = {
    title: ensureString(payload.title),
    tag: ensureString(payload.tag),
    location: ensureString(payload.location),
    client: ensureString(payload.client),
    duration: ensureString(payload.duration),
    description: ensureString(payload.description),
    img: ensureString(payload.img),
  };

  if (
    !normalized.title ||
    !normalized.tag ||
    !normalized.location ||
    !normalized.client ||
    !normalized.duration ||
    !normalized.description ||
    !normalized.img
  ) {
    return { error: "All fields are required" };
  }

  if (!normalized.img.startsWith("data:image/")) {
    return { error: "Image must be a valid base64 data URL" };
  }

  const imageBytes = getDataUrlBytes(normalized.img);
  if (imageBytes > MAX_BASE64_BYTES) {
    return {
      error: "Image is too large. Please upload an image under 6MB for MongoDB storage.",
      status: 413,
    };
  }

  return { data: normalized };
}

function ensureValidObjectId(id: string) {
  if (!id || !ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

function isAuthorizedAdmin(request: NextRequest) {
  const adminToken = process.env.ADMIN_TOKEN;
  const publicAdminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  if (!adminToken || !publicAdminToken) {
    return { authorized: false, status: 500, error: "Admin tokens are not configured" };
  }

  const accessToken = request.cookies.get("admin_access_token")?.value;
  if (!accessToken || accessToken !== adminToken || accessToken !== publicAdminToken) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }

  return { authorized: true };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    // Admin mode: page-based pagination + search for large datasets.
    if (searchParams.has("page")) {
      const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
      const limit = Math.min(
        MAX_ADMIN_LIMIT,
        Math.max(1, Number(searchParams.get("limit") ?? "10") || 10)
      );
      const query = ensureString(searchParams.get("q") ?? "");
      const skip = (page - 1) * limit;

      const filter = query
        ? {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { tag: { $regex: query, $options: "i" } },
              { location: { $regex: query, $options: "i" } },
              { client: { $regex: query, $options: "i" } },
            ],
          }
        : {};

      const [docs, totalItems] = await Promise.all([
        collection
          .find(filter)
          .sort({ _id: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(filter),
      ]);

      const items = docs.map((doc) => ({
        _id: String(doc._id),
        title: doc.title,
        tag: doc.tag,
        location: doc.location,
        client: doc.client,
        duration: doc.duration,
        description: doc.description,
        img: doc.img,
        createdAt: doc.createdAt,
      }));

      const totalPages = Math.max(1, Math.ceil(totalItems / limit));

      return NextResponse.json({
        items,
        page,
        limit,
        totalItems,
        totalPages,
      });
    }

    const limit = toPositiveInt(searchParams.get("limit"), 5);
    const cursor = searchParams.get("cursor");

    const filter =
      cursor && ObjectId.isValid(cursor)
        ? { _id: { $lt: new ObjectId(cursor) } }
        : {};

    const docs = await collection
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    const items = docs.map((doc) => ({
      _id: String(doc._id),
      title: doc.title,
      tag: doc.tag,
      location: doc.location,
      client: doc.client,
      duration: doc.duration,
      description: doc.description,
      img: doc.img,
      createdAt: doc.createdAt,
    }));

    const nextCursor = items.length === limit ? items[items.length - 1]?._id : null;

    return NextResponse.json({ items, nextCursor });
  } catch {
    return NextResponse.json({ error: "Failed to fetch marvels" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = isAuthorizedAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as MarvelPayload;
    const validated = validateMarvelPayload(body);
    if (!validated.data) {
      return NextResponse.json(
        { error: validated.error },
        { status: validated.status ?? 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const result = await collection.insertOne({
      ...validated.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true, id: String(result.insertedId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save marvel";
    return NextResponse.json(
      { error: message || "Failed to save marvel" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = isAuthorizedAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as MarvelPayload & { id?: string };
    const objectId = ensureValidObjectId(ensureString(body.id));
    if (!objectId) {
      return NextResponse.json({ error: "Invalid marvel id" }, { status: 400 });
    }

    const validated = validateMarvelPayload(body);
    if (!validated.data) {
      return NextResponse.json(
        { error: validated.error },
        { status: validated.status ?? 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          ...validated.data,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Marvel not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update marvel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = isAuthorizedAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as { id?: string };
    const objectId = ensureValidObjectId(ensureString(body.id));
    if (!objectId) {
      return NextResponse.json({ error: "Invalid marvel id" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Marvel not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete marvel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
