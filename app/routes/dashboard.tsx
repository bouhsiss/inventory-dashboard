import { Page, Card, Text, BlockStack, Button, Banner, Box, InlineGrid } from "@shopify/polaris";
import { claimStock, getInventory } from "../models/inventory.server";
import type { Route } from "./+types/dashboard";
import { Await, isRouteErrorResponse, useFetcher, useLoaderData, useRevalidator } from "react-router";
import { Suspense } from "react";

export async function loader({ request }: Route.LoaderArgs) {
    return {
        inventory: getInventory()
    }
}


export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();

    const itemId = formData.get("itemId");

    if (typeof itemId !== "string" || !itemId) {
        return {
            ok: false,
            error: "Missing item id."
        }
    }

    try {
        await claimStock(itemId);

        return {
            ok: true,
        }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Failed to claim item.",
        }
    }
}

type InventoryItem = {
    id: string;
    name: string;
    stock: number;
}

type ClaimActionData =
    | { ok: true }
    | { ok: false; error: string };

export default function DashboardPage() {
    const { inventory } = useLoaderData<typeof loader>();

    return (
        <DashboardShell
            inventoryContent={
                <Suspense fallback={<InventoryGridSkeleton />}>
                    <Await resolve={inventory}>
                        {(items: InventoryItem[]) => (
                            <InventoryList items={items} />
                        )}
                    </Await>
                </Suspense>
            }
        />
    )
}

/* --------- Dashboard Shell --------- */
function DashboardShell({ inventoryContent }: { inventoryContent: React.ReactNode }) {
    return (
        <Page title="Inventory Dashboard">
            <BlockStack gap="500">
                {/* -------- static shell -------- */}
                <Card>
                    <BlockStack gap="300">
                        <Text as="h2" variant="headingMd">
                            Inventory Overview
                        </Text>
                        <Text as="p" variant="bodyMd">
                            this dashboard  displays inventory items and lets users claim stock.
                        </Text>
                    </BlockStack>
                </Card>

                {/* -------- Inventory Section (dynamic) -------- */}
                <Card>
                    <BlockStack gap="300">
                        <Text as="h3" variant="headingSm">
                            Inventory List
                        </Text>
                        {inventoryContent}
                    </BlockStack>
                </Card>
            </BlockStack>
        </Page>
    )
}

/* -------- Loading State -------- */
function InventoryGridSkeleton() {
    return (
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">

            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <BlockStack gap="200">
                        <Box
                            minHeight="20px"
                            width="70%"
                            background="bg-fill-tertiary"
                            borderRadius="200"
                        />
                        <Box
                            minHeight="16px"
                            width="40%"
                            background="bg-fill-tertiary"
                            borderRadius="200"
                        />
                        <Box
                            minHeight="32px"
                            width="50%"
                            background="bg-fill-tertiary"
                            borderRadius="200"
                        />
                    </BlockStack>
                </Card>
            ))}

        </InlineGrid>
    )
}

/* -------- Inventory List -------- */
function InventoryList({ items }: { items: InventoryItem[] }) {
    if (!items.length) {
        return (
            <Text as="p" variant="bodyMd" tone="subdued">
                No inventory items found.
            </Text>
        )
    }

    return (
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">

            {items.map((item) => (
                <InventoryItemCard key={item.id} item={item} />
            ))}
        </InlineGrid>
    );
}

/* -------- Inventory Item Card -------- */
function InventoryItemCard({ item }: { item: InventoryItem }) {
    const fetcher = useFetcher<ClaimActionData>();

    const isThisItemSubmitting =
        fetcher.state !== "idle" &&
        fetcher.formData?.get("itemId") === item.id;

    const optimisticStock =
        isThisItemSubmitting && item.stock > 0 ? item.stock - 1 : item.stock;

    const actionError =
        fetcher.data && !fetcher.data.ok ? fetcher.data.error : null;

    return (
        <Card>
            <BlockStack gap="300">
                <BlockStack gap="100">
                    <Text as="h4" variant="headingSm">
                        {item.name}
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                        Stock: {optimisticStock}
                    </Text>
                </BlockStack>
                {actionError ? (
                    <Text as="p" variant="bodySm" tone="critical">
                        {actionError}
                    </Text>
                ) : null}
                <fetcher.Form method="post">
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button submit variant="primary" loading={isThisItemSubmitting} disabled={isThisItemSubmitting}>
                        Claim One
                    </Button>
                </fetcher.Form>
            </BlockStack>
        </Card>
    )
}

/* -------- Error Boundary -------- */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const revalidator = useRevalidator();
    const isRetrying = revalidator.state === "loading";

    let message = "Failed to load inventory.";
    let details = "Please try again.";

    if (isRouteErrorResponse(error)) {
        details = typeof error.data === "string" ?
            error.data : `${error.status} ${error.statusText}`;
    } else if (error instanceof Error) {
        details = error.message;
    }

    return (
        <DashboardShell
            inventoryContent={
                <Banner tone="critical">
                    <BlockStack gap="300">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {message}
                        </Text>
                        <Text as="p" variant="bodyMd">
                            {details}
                        </Text>
                        <Button
                            onClick={() => revalidator.revalidate()}
                            loading={isRetrying}
                            disabled={isRetrying}
                        >
                            Retry
                        </Button>
                    </BlockStack>
                </Banner>
            }
        />
    )
}