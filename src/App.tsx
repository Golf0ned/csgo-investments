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
import jQuery from "jquery";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Papa from "papaparse";

import TitleContent from "./components/TitleContent";

import "./App.css";

/** 

GENERAL TODO:
- add non-plugin server functionality
- add alerts

**/


class investments {
  #totalBuyPrice;
  #totalCurPrice;
  #table;
  #nameToIndex;

  constructor() {
    this.#totalBuyPrice = 0.0;
    this.#totalCurPrice = 0.0;
    this.#table = [["name", "count", "avgBuyPrice", "totalBuyPrice", "curPrice", "curPriceWithTax", "totalProfit"]];
    this.#nameToIndex = ["indexedNames"];
  }

  get totalBuyPrice() { return this.#totalBuyPrice }
  get totalCurPrice() { return this.#totalCurPrice }
  get table() { return this.#table }
  set table(value) { this.#table = value }

  getTotalProfit() { return this.#totalCurPrice / 1.15 - this.#totalBuyPrice }
  getIndex(name: string) { return this.#nameToIndex.indexOf(name) }

  // @ts-expect-error any types
  async uploadCSV(file, callback) {
    async function parse() {
      return await new Promise((resolve, reject) => {
        try {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            // @ts-expect-error any type
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

  // @ts-expect-error any type
  processData(inCSV) {
    const outTable = [];
    let overallBuyPrice = 0.0;
    let overallCurPrice = 0.0;

    for (let i = 0; i < inCSV.length; i++) {
      const curRow = inCSV[i];
      //console.log(curRow);

      const name = curRow.name;
      const count = curRow.count;
      const avgBuyPrice = (parseFloat(curRow.totalBuyPrice) / parseInt(curRow.count)).toFixed(2);
      const totalBuyPrice = curRow.totalBuyPrice;
      const curPrice = curRow.curPrice;
      const curPriceWithTax = (parseFloat(curRow.curPrice) / 1.15).toFixed(2);
      const totalProfit = ((parseFloat(curPriceWithTax) - parseFloat(avgBuyPrice)) * parseInt(count)).toFixed(2);

      this.#nameToIndex.push(name);

      overallBuyPrice += parseFloat(totalBuyPrice);
      overallCurPrice += parseFloat(curPrice) * parseInt(count);
      outTable.push([name, count, avgBuyPrice, totalBuyPrice,
        curPrice, curPriceWithTax, totalProfit]);
    }

    this.#table = outTable;
    this.#totalBuyPrice = overallBuyPrice;
    this.#totalCurPrice = overallCurPrice;
    this.#nameToIndex.splice(0, 1);

    //console.log(this.#table);
    //console.log(this.#nameToIndex);
  }

  exportCSV() {
    const outTable = this.#table.slice();
    return (",name,count,totalBuyPrice,curPrice\n" + outTable.map((v) => (v[0] + "," + v[1] + "," + v[3] + "," + v[4])).join("\n"));
  }

  addItem(itemName: string, count: number, price: number) {
    const index = this.getIndex(itemName);
    if (index != -1 && itemName != "name") {
      const row = this.#table[index];
      const newCount = (parseInt(row[1]) + count);
      const newTotal = parseFloat(row[3]) + price * count;
      this.#table[index][1] = newCount.toFixed();
      this.#table[index][3] = newTotal.toFixed(2);
      this.#table[index][2] = (newTotal / newCount).toFixed(2);
      this.#table[index][6] = ((parseFloat(row[5]) - parseFloat(this.#table[index][2])) * count).toFixed(2);

      this.#totalBuyPrice += price * count;
      this.#totalCurPrice += parseFloat(this.#table[index][4]) * count;
      return "SUCCESS: Updated values for \"" + itemName + "\"";
    }

    let marketPrice = "0.01";
    investments.getMarketPrice(itemName, (value: string) => {
      // TODO: Figure out waiting for this ******************************************************
      marketPrice = value;
      if (marketPrice === "false") {
        return "FAILURE: Invalid item name: make sure it's identical to the name on the Steam market (or maybe Steam API is being stinky).";
      }
      if (this.table.toString() == ["name", "count", "avgBuyPrice", "totalBuyPrice", "curPrice", "curPriceWithTax", "totalProfit"].toString()) {
        this.#table = []
      }
      this.#table.push([
        itemName,
        count.toFixed(),
        (price).toFixed(2),
        (price * count).toFixed(2),
        marketPrice,
        (parseFloat(marketPrice) / 1.15).toFixed(2),
        ((parseFloat(marketPrice) / 1.15 - price) * count).toFixed(2),
      ]);

      this.#nameToIndex.push(itemName);
      this.#totalBuyPrice += price * count;
      this.#totalCurPrice += parseFloat(marketPrice) * count;

      return "SUCCESS: Added \"" + itemName + "\"";
    });
  }

  removeItem(itemName: string, count: number) {
    const index = this.getIndex(itemName);
    if (index === -1) {
      return "FAILURE: You don't own any of \"" + itemName + '".';
    }
    if (parseInt(this.#table[index][1]) - count < 0) {
      return "FAILURE: Can't remove " + count + " items when you own " + parseInt(this.#table[index][1] as string) + ".";
    } 

    const row = this.#table[index];
    this.#totalBuyPrice -= parseFloat(row[2]);
    this.#totalCurPrice -= parseFloat(row[4]) * count;

    if (parseInt(row[1]) - count === 0) {
      this.#table.splice(index, 1);
      this.#nameToIndex.splice(index, 1);
      if (this.#table.toString() === "") {
        this.#table = [["name", "count", "avgBuyPrice", "totalBuyPrice", "curPrice", "curPriceWithTax", "totalProfit"]];
      }
      return "SUCCESS: Sold all of \"" + itemName + "\"";
    } 
    else {
      const newCount = parseInt(row[1]) - count;
      this.#table[index][1] = (newCount).toFixed();
      this.#table[index][3] = (parseFloat(row[2]) * newCount).toFixed(2);
      this.#table[index][6] = ((parseFloat(row[5]) - parseFloat(this.#table[index][2])) * newCount).toFixed(2);
      return "SUCCESS: Sold " + count + " of \"" + itemName + "\"";
    }
  }

  updateAllMarketPrices() {
    for (let i = 0; i < this.#table.length; i++) {
      this.setMarketPrice(this.#table[i][0]);
    }
    //console.log(this.table)
  }

  updateCurrentInvestment() {
    let cur = 0.0;
    for (let i = 0; i < this.#table.length; i++) {
      const row = this.#table[i];
      cur += parseFloat(row[4]) * parseInt(row[1]);
    }
    this.#totalCurPrice = cur;
  }
  
  // @ts-expect-error any type
  static getMarketPrice(itemName: string, callback) {
    if (itemName != "name") {
      const url = "https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=" + itemName.replace("&", "%26").replace(":", "%3A");

      jQuery.getJSON(url, (data) => {
        if ((data[0] === false)) {
          callback("false");
        }
        return callback(data["median_price"].slice(1));
      });
    }
  }

  setMarketPrice(itemName: string) {
    investments.getMarketPrice(itemName, (marketPrice: string) => {
      //console.log(marketPrice);
      const index = this.getIndex(itemName);
      const row = this.#table[index];

      this.#table[index][4] = marketPrice;
      this.#table[index][5] = (parseFloat(marketPrice) / 1.15).toFixed(2);
      this.#table[index][6] = ((parseFloat(this.#table[index][5]) - parseFloat(row[2])) * parseInt(row[1])).toFixed(2);
    });
  }
}

let data = new investments();

export default function App() {
  const [page, setPage] = useState("Home");
  const [initInvestment, setInitInvestment] = useState(data.totalBuyPrice);
  const [curInvestment, setCurInvestment] = useState(data.totalCurPrice);
  const [totalProfit, setTotalProfit] = useState(data.getTotalProfit());
  const [table, setTable] = useState(data.table);

  function refreshAll() {
    data.updateCurrentInvestment();
    setInitInvestment(data.totalBuyPrice);
    setCurInvestment(data.totalCurPrice);
    setTotalProfit(data.getTotalProfit());
  }

  function handleNavClick(newPage: string) {
    //console.log("Changed page to " + newPage);
    setPage(newPage);
  }

  function handleUpdatePricesButton() {
    data.updateAllMarketPrices();
    setTable(data.table);
    setPage("Investments");
  }

  function NavPane() {
    return (
      <>
        <Navbar expand="md">
          <Container>
            <Navbar.Brand
              onClick={() => {
                refreshAll();
                handleNavClick("Home");
              }}
            >
              CSGO Investments
            </Navbar.Brand>
            <Nav>
              <Nav.Link onClick={() => handleNavClick("About")}>About</Nav.Link>
              <Nav.Link
                onClick={() => {
                  refreshAll();
                  handleNavClick("Investments");
                }}
              >
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
      [["name", "count", "avgBuyPrice", "totalBuyPrice", "curPrice", "curPriceWithTax", "totalProfit"]].toString()
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
      <>
        <Container>
          <Button
            onClick={() => { handleUpdatePricesButton() }}
            variant="secondary"
            style={{ float: "right" }}
          >
            Update Steam Prices
          </Button>
        </Container>

        <Table hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>#</th>
              <th>Average Buy Price</th>
              <th>Total Buy Price</th>
              <th>Steam Sell Price</th>
              <th>Total Profit (w/ Steam Tax)</th>
            </tr>
          </thead>
          <tbody>
            <TableRows />
          </tbody>
        </Table>
      </>
    );
  }

  function TableRows() {
    return table.map((row) => {
      if(row[0] != "name") {
        return (
          <tr key={"row" + data.getIndex(row[0])}>
            <td key={"row" + data.getIndex(row[0]) + ",0"}>{row[0]}</td>
            <td key={"row" + data.getIndex(row[0]) + ",1"}>{row[1]}</td>
            <td key={"row" + data.getIndex(row[0]) + ",2"}>${row[2]}</td>
            <td key={"row" + data.getIndex(row[0]) + ",3"}>${row[3]}</td>
            <td key={"row" + data.getIndex(row[0]) + ",4"}>${row[4]}</td>
            <td key={"row" + data.getIndex(row[0]) + ",6"}>${row[6]}</td>
          </tr>
        );
      }
    });
  }

  function InputCSV() {
    // @ts-expect-error any type
    const changeHandler = (event) => {
      data = new investments();
      data.uploadCSV(event.target.files[0], () => {
        refreshAll();
        setTable(data.table);
        setPage("Investments");
      });
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
      const link = document.createElement("a");
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
    const [formName, setFormName] = useState("name");
    const [formCount, setFormCount] = useState(0);
    const [formPrice, setFormPrice] = useState(0.0);

    function handleAddItem(name: string, count: number, price: number) {
      const success = data.addItem(name, count, price);
      setTable(data.table);
      console.log(success);
      setFormName("name");
      setFormCount(0);
      setFormPrice(0.0);
    }

    return (
      <>
        <div style={{ marginBottom: "0.4em" }}>Add Items</div>
        <Form
          style={{ maxWidth: "85%", margin: "auto" }}
          onSubmit={(e) => {
            e.preventDefault();
            handleAddItem(formName, formCount, formPrice);
            // @ts-expect-error reset
            e.target.reset();
          }}
        >
          <Stack gap={3}>
            <Row>
              <Form.Group>
                <Form.Control
                  name="name"
                  type="string"
                  onChange={(e) => {
                    e.preventDefault();
                    setFormName(e.target.value);
                  }}
                  placeholder="Item Name (Paste from Steam)"
                />
              </Form.Group>
            </Row>
            <Row>
              <Col>
                <Form.Group>
                  <Form.Control
                    name="count"
                    type="number"
                    onChange={(e) => {
                      e.preventDefault();
                      setFormCount(parseInt(e.target.value));
                    }}
                    placeholder="Count"
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Control
                    name="price"
                    type="number"
                    step="0.01"
                    onChange={(e) => {
                      e.preventDefault();
                      setFormPrice(parseFloat(e.target.value));
                    }}
                    placeholder="Purchase Unit Price ($)"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Button
                style={{ maxWidth: "96%", margin: "auto" }}
                variant="secondary"
                type="submit"
              >
                Submit
              </Button>
            </Row>
          </Stack>
        </Form>
      </>
    );
  }

  function RemoveItem() {
    const [formName, setFormName] = useState("name");
    const [formCount, setFormCount] = useState(0);

    function handleRemoveItem(name: string, count: number) {
      const success = data.removeItem(name, count);
      setTable(data.table);
      console.log(success);
      setFormName("name");
      setFormCount(0);
    }

    return (
      <>
        <div style={{ marginBottom: "0.4em" }}>Remove Items</div>
        <Form
          style={{ maxWidth: "85%", margin: "auto" }}
          onSubmit={(e) => {
            e.preventDefault();
            handleRemoveItem(formName, formCount);
            // @ts-expect-error reset
            e.target.reset()
          }}
        >
          <Stack gap={3}>
            <Row>
              <Form.Group>
                <Form.Control
                  name="name"
                  type="string"
                  onChange={(e) => {
                    e.preventDefault();
                    setFormName(e.target.value);
                  }}
                  placeholder="Item Name (Paste from Steam)"
                />
              </Form.Group>
            </Row>
            <Row>
              <Form.Group>
                <Form.Control
                  name="count"
                  type="number"
                  onChange={(e) => {
                    e.preventDefault();
                    setFormCount(parseInt(e.target.value));
                  }}
                  placeholder="Count"
                />
              </Form.Group>
            </Row>
            <Row>
              <Button
                style={{ maxWidth: "96%", margin: "auto" }}
                variant="secondary"
                type="submit"
              >
                Submit
              </Button>
            </Row>
          </Stack>
        </Form>
      </>
    );
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
                  <Card.Header>Current Value</Card.Header>
                  <Card.Body>${curInvestment.toFixed(2)}</Card.Body>
                </Card>
              </Col>
              <Col>
                <Card>
                  <Card.Header>Initial Investment</Card.Header>
                  <Card.Body>${initInvestment.toFixed(2)}</Card.Body>
                </Card>
              </Col>
              <Col>
                <Card>
                  <Card.Header>Total Profit (w/ Steam Tax)</Card.Header>
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
              <div style={{ marginBottom: "1em" }}>
                I built this website since I was bored of checking steam market
                prices manually and updating a spreadsheet.
              </div>
              <div style={{ marginBottom: "1em" }}>
                Current functionality requires the Allow CORS plugin from Chrome
                (
                <a href="https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf">
                  available here
                </a>
                ), since I currently have no plan for building a CORS proxy.
              </div>
              <div style={{ marginBottom: "1em" }}>
                This project was built in React using Vite. It utilizes React
                Bootstrap fairly heavily to look pretty. The website refreshes
                from a steam market price endpoint, but long-term support would
                require a proper API (which I currently do not have the budget
                for).
              </div>
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
              <div>Add or remove items here.</div>
            </Row>
            <Row>
              <Col>
                <AddItem />
              </Col>
              <Col>
                <RemoveItem />
              </Col>
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
