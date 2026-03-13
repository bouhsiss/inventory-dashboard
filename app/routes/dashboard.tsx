import { Page, Card, Text, BlockStack, InlineStack, Spinner } from "@shopify/polaris";
import { getInventory } from "../models/inventory.server";
import type { Route } from "./+types/dashboard";
import { Await, useLoaderData } from "react-router";
import { Suspense } from "react";

export async function loader({ request }: Route.LoaderArgs) {
    return {
        inventory: getInventory()
    }
}

type InventoryItem = {
    id: string;
    name: string;
    stock: number;
}

export default function DashboardPage() {
    const { inventory } = useLoaderData<typeof loader>();

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
                        <Suspense fallback={<InventoryGridSkeleton />}>
                            <Await resolve={inventory}>
                                {(items: InventoryItem[]) => (
                                    <InventoryList items={items} />
                                )}
                            </Await>
                        </Suspense>
                    </BlockStack>
                </Card>
            </BlockStack>
        </Page>
    )
}

/* -------- Loading State -------- */
function InventoryGridSkeleton() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
            }}
        >
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <BlockStack gap="100">
                        <div
                            style={{
                                height: "20px",
                                width: "70%",
                                borderRadius: "6px",
                                background: "var(--p-color-bg-fill-tertiary)",
                            }}
                        />
                        <div
                            style={{
                                height: "16px",
                                width: "40%",
                                borderRadius: "6px",
                                background: "var(--p-color-bg-fill-tertiary)",
                            }}
                        />
                    </BlockStack>
                </Card>
            ))}

        </div>
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
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
            }}
        >
            {items.map((item) => (
                <Card key={item.id}>
                    <BlockStack gap="100">
                        <Text as="h4" variant="headingSm">
                            {item.name}
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                            Stock: {item.stock}
                        </Text>
                    </BlockStack>
                </Card>
            ))}
        </div>
    );
}