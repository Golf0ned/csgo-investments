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

/* 
Todo:
- update front matter values on add/remove item (initial investment)
- make adding new items work (async hell lol)
- update profit column on remove

- add non-plugin server functionality
*/

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Papa from "papaparse";

import TitleContent from "./components/TitleContent";

import "./App.css";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import jQuery from "jquery";

class investments {
  #totalInitialInvestment;
  #totalCurrentInvestment;
  #table;
  //@ts-ignore
  #nameToIndex;

  constructor() {
    // TODO: open filstream for file, update initial and current investments from file, and update lastUpdated timestamp
    this.#totalInitialInvestment = 0.0;
    this.#totalCurrentInvestment = 0.0;
    this.#table = [["please", "enter", "some", "data", 0.0, 0.0, 0.0]];
    this.#nameToIndex = [];
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
      this.addNameToIndex(curRow.name);
      totalInitCost += parseFloat(curRow.totalCost);
      totalCurCost += curRow.count * parseFloat(curRow.marketPrice);
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
      ",name,count,totalCost,marketPrice\n" +
      outTable.map((v) => v.slice(0, 4).join(",")).join("\n")
    );
  }

  addNameToIndex(name: string) {
    this.#nameToIndex.push(name);
  }

  getIndex(name: string) {
    return this.#nameToIndex.indexOf(name);
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
    return this.totalCurrentInvestment / 1.15 - this.totalInitialInvestment;
  }

  addItem(itemName: string, count: number, price: number) {
    var index = this.getIndex(itemName);
    if (index != -1) {
      this.#table[index][1] = parseInt(this.#table[index][1] as string) + count;
      this.#table[index][2] =
        parseInt(this.#table[index][2] as string) + price * count;
      this.#table[index][4] =
        parseFloat(this.#table[index][2] as string) /
        parseInt(this.#table[index][1] as string);
      this.#table[index][6] =
        (parseFloat(this.#table[index][5] as string) -
          parseFloat(this.#table[index][4] as string)) *
        parseInt(this.#table[index][1] as string);
      return "success";
    }
    var marketPrice = "0.00";

    this.getMarketPrice(itemName, (value: string) => {
      // TODO: Figure out waiting for this ******************************************************
      marketPrice = value;
    });

    if (marketPrice === "false") {
      return "Invalid item name: make sure it's identical to the name on the Steam market.";
    }

    if (
      this.table.toString() ===
      [["please", "enter", "some", "data", 0.0, 0.0, 0.0]].toString()
    ) {
      this.#table = [
        [
          itemName,
          count as unknown as string,
          (price * count) as unknown as string,
          marketPrice,
          price,
          parseFloat(marketPrice) / 1.15,
          (parseFloat(marketPrice) / 1.15 - price) * count,
        ],
      ];
      return "success";
    }

    this.#table.push([
      itemName,
      count as unknown as string,
      (price * count) as unknown as string,
      marketPrice,
      price,
      parseFloat(marketPrice) / 1.15,
      (parseFloat(marketPrice) / 1.15 - price) * count,
    ]);
  }

  removeItem(itemName: string, count: number) {
    var index = this.getIndex(itemName);
    if (index === -1) {
      return "You don't own any of \"" + itemName + '".';
    }
    if (parseInt(this.#table[index][1] as string) - count < 0) {
      return (
        "Can't remove " +
        count +
        " items when you own " +
        parseInt(this.#table[index][1] as string) +
        "."
      );
    } else if (parseInt(this.#table[index][1] as string) - count == 0) {
      this.#table.splice(index, 1);
      this.#nameToIndex.splice(index, 1);
      return "success";
    } else {
      this.#table[index][1] = (
        parseInt(this.#table[index][1] as string) - count
      ).toString();
      this.#table[index][2] = (
        parseFloat(this.#table[index][4] as string) *
        parseInt(this.#table[index][1] as string)
      ).toFixed(2);
      this.#table[index][6] =
        (parseFloat(this.#table[index][5] as string) -
          parseFloat(this.#table[index][6] as string)) *
        parseInt(this.#table[index][1] as string);
      return "success";
    }
  }

  updateAllMarketPrices() {
    for (var i = 0; i < this.#table.length; i++) {
      this.setMarketPrice(this.#table[i][0] as string);
      console.log("First: [" + i + "]" + this.#table[i][3]);
    }
  }

  updateCurrentInvestment() {
    var cur = 0;
    for (var i = 0; i < this.#table.length; i++) {
      cur +=
        parseFloat(this.#table[i][3] as string) *
        parseInt(this.#table[i][1] as string);
    }
    this.#totalCurrentInvestment = cur;
  }

  getMarketPrice(itemName: string, callback: Function) {
    var url =
      "https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=" +
      itemName;

    jQuery.getJSON(url, (data) => {
      if ((data[0] = false)) {
        callback("false");
      }
      return callback(data["median_price"].slice(1));
    });
  }

  setMarketPrice(itemName: string) {
    this.getMarketPrice(itemName, (price: string) => {
      this.table[this.getIndex(itemName)][3] = price;
      this.table[this.getIndex(itemName)][5] = parseFloat(price) / 1.15;
      this.table[this.getIndex(itemName)][6] =
        (parseFloat(price) / 1.15 -
          parseFloat(this.table[this.getIndex(itemName)][4] as string)) *
        parseInt(this.table[this.getIndex(itemName)][1] as string);
    });
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
    data.updateCurrentInvestment();
    setInitInvestment(data.totalInitialInvestment);
    setCurInvestment(data.totalCurrentInvestment);
    setTotalProfit(data.getTotalProfit());
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
      [["please", "enter", "some", "data", 0.0, 0.0, 0.0]].toString()
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
            onClick={() => {
              data.updateAllMarketPrices();
            }}
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
              <th>Initial Price</th>
              <th>Current Price</th>
              <th>Profit (w/ Market Fees)</th>
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
            <td>${row[4].toFixed(2)}</td>
            <td>${parseFloat(row[3]).toFixed(2)}</td>
            <td>${row[6].toFixed(2)}</td>
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
    const [formName, setFormName] = useState("name");
    const [formCount, setFormCount] = useState(0);
    const [formPrice, setFormPrice] = useState(0.0);

    function handleAddItem(name: string, count: number, price: number) {
      var success = data.addItem(name, count, price);
      console.log(success);
    }

    return (
      <>
        <div style={{ marginBottom: "0.4em" }}>Add Items</div>
        <Form
          style={{ maxWidth: "85%", margin: "auto" }}
          onSubmit={(e) => {
            e.preventDefault();
            handleAddItem(formName, formCount, formPrice);
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
                    type="decimal"
                    onChange={(e) => {
                      e.preventDefault();
                      setFormPrice(parseFloat(e.target.value));
                    }}
                    placeholder="Purchase Price ($)"
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
      var success = data.removeItem(name, count);
      console.log(success);
    }

    return (
      <>
        <div style={{ marginBottom: "0.4em" }}>Remove Items</div>
        <Form
          style={{ maxWidth: "85%", margin: "auto" }}
          onSubmit={(e) => {
            e.preventDefault();
            handleRemoveItem(formName, formCount);
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
                  <Card.Header>Total Profit (w/ Market Fees)</Card.Header>
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
