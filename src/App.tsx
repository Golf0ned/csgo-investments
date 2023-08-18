import { useState } from "react";

import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Nav,
  Navbar,
  NavDropdown,
  Row,
  Stack,
  Table,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Papa from "papaparse";

import TitleContent from "./components/TitleContent";

import "./App.css";

class investments {
  #totalInitialInvestment;
  #totalCurrentInvestment;
  #table;
  #lastUpdated;

  #nameToIndex;

  constructor() {
    // TODO: open filstream for file, update initial and current investments from file, and update lastUpdated timestamp
    this.#totalInitialInvestment = 0.0;
    this.#totalCurrentInvestment = 0.0;
    this.#table = [["this", "array", "is", "empty", 0.0, 0.0, 0.0]];
    this.#nameToIndex = new Map();
    this.#lastUpdated = 0;
  }

  /* @ts-expect-error */
  async uploadCSV(file, callback) {
    async function parse() {
      return await new Promise((resolve, reject) => {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            /* @ts-expect-error */
            complete: (results) => {
              resolve(results.data);
            },
          });
        } catch (e) {
          reject(e);
        }
      });
    }
    parse().then((data) => {
      this.processData(data);
      callback();
    });
  }

  /* @ts-expect-error */
  processData(inCSV) {
    var outTable: any[] = [];
    var totalCurCost = 0.0;
    var totalInitCost = 0.0;

    for (var i = 0; i < inCSV.length; i++) {
      var curRow = inCSV[i];
      this.addNameToIndex(curRow.name, i);
      totalInitCost += parseFloat(curRow.totalCost);
      totalCurCost += (curRow.count * parseFloat(curRow.marketPrice)) / 1.15;
      outTable = [
        ...outTable,
        [
          curRow.name,
          curRow.count,
          curRow.totalCost,
          curRow.marketPrice,
          curRow.totalCost / curRow.count,
          curRow.marketPrice / 1.15,
          (curRow.marketPrice / 1.15 - curRow.totalCost / curRow.count) *
            curRow.count,
        ],
      ];
    }

    this.#table = outTable;
    this.#totalCurrentInvestment = totalCurCost;
    this.#totalInitialInvestment = totalInitCost;

    console.log(this.table);
  }

  exportCSV() {
    const outTable = this.table.slice();

    return (
      this.table[0][0] +
      "," +
      outTable.map((v) => v.slice(0, 4).join(",")).join("\n")
    );
  }

  addNameToIndex(name: string, index: number) {
    this.#nameToIndex.set(name, index);
  }

  getIndex(name: string) {
    return this.#nameToIndex.get(name);
  }

  set table(value) {
    this.#table = value;
  }

  get totalCurrentInvestment() {
    return this.#totalCurrentInvestment;
  }

  get totalInitialInvestment() {
    return this.#totalInitialInvestment;
  }

  get table() {
    return this.#table;
  }

  getTotalProfit() {
    return this.totalCurrentInvestment - this.totalInitialInvestment;
  }

  /* @ts-expect-error */
  currentValueOf(itemName: string) {
    // TODO: return market price of itemName
    return 0.76;
  }

  /* @ts-expect-error */
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

  /* @ts-expect-error */
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

var data = new investments();

export default function App() {
  const [page, setPage] = useState("Home");
  const [initInvestment, setInitInvestment] = useState(
    data.totalInitialInvestment
  );
  const [curInvestment, setCurInvestment] = useState(
    data.totalCurrentInvestment
  );
  const [totalProfit, setTotalProfit] = useState(data.getTotalProfit());

  function refreshAll() {
    setInitInvestment(data.totalInitialInvestment);
    setCurInvestment(data.totalCurrentInvestment);
    setTotalProfit(data.getTotalProfit());
  }

  function NavPane() {
    return (
      <>
        <Navbar expand="md" fixed="top">
          <Container>
            <Navbar.Brand onClick={() => handleNavClick("Home")}>
              CSGO Investments
            </Navbar.Brand>
            <Nav>
              <Nav.Link onClick={() => handleNavClick("About")}>About</Nav.Link>
              <Nav.Link onClick={() => handleNavClick("Investments")}>
                Investments
              </Nav.Link>
              <NavDropdown align="end" title="Edit">
                <NavDropdown.Item onClick={() => handleNavClick("Modify")}>
                  <div>Add/Remove Items</div>
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => handleNavClick("InOut")}>
                  <div>Import/Export</div>
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Container>
        </Navbar>
      </>
    );
  }

  function InvestmentTable() {
    if (
      data.table.toString() ===
      [["this", "array", "is", "empty", 0.0, 0.0, 0.0]].toString()
    ) {
      return (
        <Stack gap={3}>
          <div>Nothing found. :(</div>
          <div>Add items or import an existing list:</div>
          <Row style={{ width: "80%", margin: "auto" }}>
            <Col>
              <Button
                style={{ width: "80%" }}
                variant="secondary"
                onClick={() => handleNavClick("Modify")}
              >
                Add items
              </Button>
            </Col>
            <Col>
              <Button
                style={{ width: "80%" }}
                variant="secondary"
                onClick={() => handleNavClick("InOut")}
              >
                Import from file
              </Button>
            </Col>
          </Row>
        </Stack>
      );
    }
    return (
      <Table hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>#</th>
            <th>Initial Price</th>
            <th>Current Price</th>
            <th>Total Profit</th>
          </tr>
        </thead>
        <tbody>
          <TableRows />
        </tbody>
      </Table>
    );
  }

  function TableRows() {
    return data.table.slice().map((row) => {
      if (
        typeof row[3] === "string" &&
        typeof row[4] === "number" &&
        typeof row[6] === "number"
      ) {
        return (
          <tr key={"row" + data.getIndex(row[0] as string)}>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
            <td>{row[4].toFixed(2)}</td>
            <td>{parseFloat(row[3]).toFixed(2)}</td>
            <td>{row[6].toFixed(2)}</td>
          </tr>
        );
      }
    });
  }

  function handleNavClick(newPage: string) {
    console.log("page now " + newPage);
    setPage(newPage);
  }

  function InputCSV() {
    /* @ts-expect-error */
    const changeHandler = (event) => {
      data.uploadCSV(event.target.files[0], () => refreshAll());
    };

    return (
      <Form>
        <Form.Group controlId="Input">
          <Form.Label>Upload Data (.csv)</Form.Label>
          <Form.Control type="file" accept=".csv" onChange={changeHandler} />
        </Form.Group>
      </Form>
    );
  }

  function OutputCSV() {
    function exportData() {
      const out = encodeURI("data:text/csv;charset=utf-8" + data.exportCSV());
      var link = document.createElement("a");
      link.setAttribute("href", out);
      link.setAttribute("download", "output.csv");
      document.body.appendChild(link); // Required for FF
      link.click();
    }

    return (
      <>
        <div>Download Data</div>
        <Button
          style={{ marginTop: "0.4em", width: "100%" }}
          variant="secondary"
          onClick={() => exportData()}
        >
          Download (.csv)
        </Button>
      </>
    );
  }

  function AddItem() {
    return <></>;
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
                  <Card.Body>${curInvestment.toFixed(2)}</Card.Body>
                </Card>
              </Col>
              <Col>
                <Card>
                  <Card.Header>Total Investment</Card.Header>
                  <Card.Body>${initInvestment.toFixed(2)}</Card.Body>
                </Card>
              </Col>
              <Col>
                <Card>
                  <Card.Header>Total Profit</Card.Header>
                  <Card.Body>${totalProfit.toFixed(2)}</Card.Body>
                </Card>
              </Col>
            </Row>
            <Row>
              <Button
                style={{ width: "50%", margin: "auto" }}
                onClick={() => handleNavClick("Investments")}
                variant="secondary"
                size="lg"
              >
                See All Items
              </Button>
            </Row>
          </Stack>
        </Container>
      </>
    );
  } else if (page === "About") {
    return (
      <>
        <NavPane />
        <Container>
          <Stack gap={4}>
            <TitleContent />
            <Row>
              <div>About page. WIP.</div>
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
              <InvestmentTable />
            </Row>
          </Stack>
        </Container>
      </>
    );
  } else if (page === "Modify") {
    return (
      <>
        <NavPane />
        <Container>
          <Stack gap={4}>
            <TitleContent />
            <Row>
              <AddItem />
            </Row>
          </Stack>
        </Container>
      </>
    );
  } else if (page === "InOut") {
    return (
      <>
        <NavPane />
        <Container>
          <Stack gap={4}>
            <TitleContent />
            <Row>
              <div>Import and export data here.</div>
            </Row>
            <Row style={{ width: "80%", margin: "auto" }}>
              <Col>
                <InputCSV />
              </Col>
              <Col>
                <OutputCSV />
              </Col>
            </Row>
          </Stack>
        </Container>
      </>
    );
  } else {
    <div>Page not found. :/</div>;
  }
}
