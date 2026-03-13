import { Page, Card, Button, Text, BlockStack } from "@shopify/polaris"
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Page title="Inventory App">
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Inventory Dashboard Demo
          </Text>
          <Text as="p" variant="bodyMd">
            Open the dashboard to view inventory and claim stock items.
          </Text>
          <Button variant="primary" onClick={() =>  navigate("/dashboard")}>
            Go to Dashboard 
          </Button>
        </BlockStack>
      </Card>
    </Page>
  )
}
