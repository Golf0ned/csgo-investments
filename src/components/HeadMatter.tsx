import { Stack, Row, Col, Card, Button } from "react-bootstrap";

export default function HeadMatter() {
  return (
    <>
      <Stack gap={4}>
        <Row>
          <h1>Golf0ned's CSGO Investments</h1>
        </Row>
        <Row>
          <div>
            Got tired of updating spreadsheet. Made web app to do thing.
          </div>
        </Row>
        <Row>
          <Col>
            <Card>
              <Card.Header>Total Value</Card.Header>
              <Card.Body>${getCurrentInvestmentValue()}</Card.Body>
            </Card>
          </Col>
          <Col>
            <Card>
              <Card.Header>Total Investment</Card.Header>
              <Card.Body>${getInitialInvestmentValue()}</Card.Body>
            </Card>
          </Col>
          <Col>
            <Card>
              <Card.Header>Total Profit</Card.Header>
              <Card.Body>${getProfit()}</Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Button variant="secondary" size="lg">
            See All Items
          </Button>
        </Row>
      </Stack>
    </>
  );
}

function getCurrentInvestmentValue() {
  return 100.0;
}

function getInitialInvestmentValue() {
  return 100.0;
}

function getProfit() {
  return getCurrentInvestmentValue() - getInitialInvestmentValue();
}
