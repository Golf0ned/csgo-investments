import { useState } from "react";

import {
  Button,
  Card,
  Col,
  Container,
  Nav,
  Navbar,
  Row,
  Stack,
  Table,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import TitleContent from "./components/TitleContent";

import "./App.css";

export default function App() {
  const [page, setPage] = useState("Home");

  var data = new investments("data.csv");

  function NavPane() {
    return (
      <>
        <Navbar expand="lg" fixed="top">
          <Container>
            <Navbar.Brand onClick={() => handleNavClick("Home")}>
              CSGO Investments
            </Navbar.Brand>
            <Nav>
              <Nav.Link onClick={() => handleNavClick("Investments")}>
                Investments
              </Nav.Link>
              <Nav.Link onClick={() => handleNavClick("Add")}>
                Add Items
              </Nav.Link>
            </Nav>
          </Container>
        </Navbar>
      </>
    );
  }

  function handleNavClick(newPage: string) {
    console.log("page now " + newPage);
    setPage(newPage);
  }

  if (page === "Home") {
    return (
      <>
        <NavPane />
        <Container>
          <Stack gap={4}>
            <TitleContent />
            <Row>
              <Col>
                <Card>
                  <Card.Header>Total Value</Card.Header>
                  <Card.Body>${data.totalCurrentInvestment}</Card.Body>
                </Card>
              </Col>
              <Col>
                <Card>
                  <Card.Header>Total Investment</Card.Header>
                  <Card.Body>${data.totalinitialInvestment}</Card.Body>
                </Card>
              </Col>
              <Col>
                <Card>
                  <Card.Header>Total Profit</Card.Header>
                  <Card.Body>${data.getTotalProfit()}</Card.Body>
                </Card>
              </Col>
            </Row>
            <Row>
              <Button variant="secondary" size="lg">
                See All Items
              </Button>
            </Row>
          </Stack>
        </Container>
      </>
    );
  } else if (page === "Investments") {
    return (
      <>
        <NavPane />
        <Container>
          <Stack gap={4}>
            <TitleContent />
            <Row>
              <Table>
                <h3>[Table placeholder]</h3>
              </Table>
            </Row>
          </Stack>
        </Container>
      </>
    );
  } else if (page === "Add") {
    return (
      <>
        <NavPane />
        <Container>
          <Stack gap={4}>
            <TitleContent />
            <Row>
              <Table>
                <h3>[Form to add item placeholder]</h3>
              </Table>
            </Row>
          </Stack>
        </Container>
      </>
    );
  } else {
    <div>Page not found. :/</div>;
  }
}

class investments {
  #totalinitialInvestment;
  #totalCurrentInvestment;
  //#table;
  #lastUpdated;

  constructor(filename: string) {
    // TODO: open filstream for file, update initial and current investments from file, and update lastUpdated timestamp
    this.#totalinitialInvestment = 50.0;
    this.#totalCurrentInvestment = 67.83;

    this.#lastUpdated = 0;
  }

  get totalCurrentInvestment() {
    return this.#totalCurrentInvestment;
  }

  get totalinitialInvestment() {
    return this.#totalinitialInvestment;
  }

  getTotalProfit() {
    return this.totalCurrentInvestment - this.totalinitialInvestment;
  }

  currentValueOf(itemName: string) {
    // TODO: return market price of itemName
    return 0.76;
  }

  initialValueOf(itemName: string) {
    // TODO: return average purchase price of itemName
    return 0.69;
  }

  profitOf(itemName: string) {
    return this.currentValueOf(itemName) - this.initialValueOf(itemName);
  }

  addItem() {
    // TODO: params
    // TODO: Add a new item to the data sheet
  }

  marketPriceOf(itemName: string) {
    // TODO: get current price of itemName
  }

  updateAllMarketPrices() {
    // TODO: for every item in the data sheet, update item prices
    if (Date.now() - this.#lastUpdated < 300000) {
      return;
    }
  }

  updateMarketPrice(itemName: string) {
    var url =
      "https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=" +
      itemName;
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);
    xhr.responseType = "json";
    xhr.onload = function () {
      var status = xhr.status;
      if (status === 200) {
        alert("Your query count: " + xhr.response.query.count);
      } else {
        alert("Something went wrong: " + status);
      }
    };

    if (xhr.status !== 200) {
      return;
    }

    xhr.send();

    const marketPrice = xhr.response.query.parse();
    return marketPrice["median_price"];
  }
}
