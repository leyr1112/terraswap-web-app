import Chart from "components/Chart"
import Card from "components/Card"
import List from "components/List"
import React, { useState, useMemo } from "react"
import styled from "styled-components"
import { useQuery } from "react-query"

import Summary from "./Summary"
import useDashboardAPI from "rest/useDashboardAPI"
import { formatMoney, lookup } from "libs/parse"
import { UST } from "constants/constants"
import Table from "components/Table"
import { Link, useHistory } from "react-router-dom"
import AssetIcon from "components/AssetIcon"

const Wrapper = styled.div`
  width: 100%;
  height: auto;
  position: relative;
  color: ${({ theme }) => theme.primary};

  & input {
    text-align: center;
    padding: 6px 16px 5px;
    border-radius: 8px;
    border: solid 1px ${({ theme }) => theme.primary};
  }
`

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const Row = styled.div`
  width: 100%;
  height: auto;
  position: relative;
  display: flex;
  justify-content: space-between;

  & > div {
    flex: 1;
  }

  .left {
    width: 1vw;
    float: left;
    margin-right: 10px;
  }
  .right {
    width: 1vw;
    float: right;
    margin-left: 10px;
  }

  @media screen and (max-width: ${({ theme }) => theme.breakpoint}) {
    display: block;
    gap: unset;

    & > div {
      flex: unset;
      margin-bottom: unset;
    }

    .left {
      width: 100%;
      float: left;
      magin: unset;
    }

    .right {
      width: 100%;
      float: left;
      margin-left: 0px;
      margin-top: 20px;
    }
  }
`

const Dashboard = () => {
  const history = useHistory()
  const { api } = useDashboardAPI()
  const { data: recent } = useQuery("recent", api.terraswap.getRecent)
  const { data: pairs, isLoading: isPairsLoading } = useQuery(
    "pairs",
    api.pairs.list
  )
  const { data: chart } = useQuery("terraswap", async () => {
    const now = Date.now()
    const fromDate = new Date(now - 90 * 24 * 60 * 60 * 1000)

    const res = await api.terraswap.getChartData({
      unit: "day",
      from: fromDate.toISOString().split("T")[0],
      to: new Date(now).toISOString().split("T")[0],
    })

    return res
  })
  const [searchKeyword, setSearchKeyword] = useState("")

  const topLiquidity = useMemo(() => {
    return pairs
      ?.sort((a, b) => Number(b.liquidityUst) - Number(a.liquidityUst))
      .slice(0, 5)
  }, [pairs])

  const topTrading = useMemo(() => {
    return pairs
      ?.sort((a, b) => Number(b.volumeUst) - Number(a.volumeUst))
      .slice(0, 5)
  }, [pairs])

  return (
    <Wrapper>
      <Container>
        <Summary
          data={[
            {
              label: "Volume 24H",
              value: recent?.daily?.volume
                ? `${lookup(recent?.daily?.volume, UST)}`
                : "",
              variation: parseFloat(
                (
                  parseFloat(recent?.daily?.volumeIncreasedRate || "0") * 100
                ).toFixed(2)
              ),
            },
            {
              label: "Volume 7D",
              value: recent?.weekly?.volume
                ? `${lookup(recent?.weekly?.volume, UST)}`
                : "",
              variation: parseFloat(
                (
                  parseFloat(recent?.weekly?.volumeIncreasedRate || "0") * 100
                ).toFixed(2)
              ),
            },
            {
              label: "Fee 24H",
              value: recent?.daily?.fee
                ? `${lookup(recent?.daily?.fee, UST)}`
                : "",
              variation: parseFloat(
                (
                  parseFloat(recent?.daily?.feeIncreasedRate || "0") * 100
                ).toFixed(2)
              ),
            },
            {
              label: "TVL",
              value: recent?.daily?.liquidity
                ? `${lookup(recent?.daily?.liquidity, UST)}`
                : "",
              variation: parseFloat(
                (
                  parseFloat(recent?.daily?.liquidityIncreasedRate || "0") * 100
                ).toFixed(2)
              ),
            },
          ]}
        />
        <Row>
          <Card className="left">
            <div style={{ marginBottom: 10 }}>
              <b>Transaction Volume</b>
            </div>
            <br />
            <Chart
              type="line"
              height={167}
              data={chart?.map((volume) => {
                return {
                  t: new Date(volume.timestamp),
                  y: Number(lookup(volume.volumeUst, UST)),
                }
              })}
            />
          </Card>
          <Card className="right">
            <div style={{ marginBottom: 10 }}>
              <b>Top Trading</b>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                className="desktop-only"
                style={{
                  display: "inline-block",
                  maxWidth: 208,
                  maxHeight: 208,
                  padding: 16,
                  flex: 1,
                }}
              >
                <Chart
                  type="pie"
                  labels={topTrading?.map((item) => item.pairAlias)}
                  data={topTrading?.map((item) => Number(item.volumeUst))}
                />
              </div>
              <div style={{ flex: 2 }}>
                <List
                  data={(topTrading || [])?.map((item) => {
                    const {
                      token0,
                      token0Symbol,
                      token1,
                      token1Symbol,
                      volumeUst,
                      pairAddress,
                    } = item
                    return (
                      <Link
                        to={`/pairs/${pairAddress}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          flexWrap: "nowrap",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div>
                          <AssetIcon address={token0} alt={token0Symbol} />
                          <AssetIcon
                            address={token1}
                            alt={token1Symbol}
                            style={{ left: -8 }}
                          />
                        </div>
                        <div>
                          {token0Symbol}-{token1Symbol} /&nbsp;
                          {formatMoney(Number(lookup(volumeUst, UST)))} UST
                        </div>
                      </Link>
                    )
                  })}
                />
              </div>
            </div>
          </Card>
        </Row>
        <Row>
          <Card className="left">
            <div style={{ marginBottom: 10 }}>
              <b>Total Liquidity</b>
            </div>
            <br />
            <Chart
              type="line"
              height={167}
              data={chart?.map((liquidity) => {
                return {
                  t: new Date(liquidity.timestamp),
                  y: Number(lookup(liquidity.liquidityUst, UST)),
                }
              })}
            />
          </Card>
          <Card className="right">
            <div style={{ marginBottom: 10 }}>
              <b>Top Liquidity</b>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                className="desktop-only"
                style={{
                  display: "inline-block",
                  maxWidth: 208,
                  maxHeight: 208,
                  padding: 16,
                  flex: 1,
                }}
              >
                <Chart
                  type="pie"
                  labels={topLiquidity?.map((item) => item.pairAlias)}
                  data={topLiquidity?.map((item) => Number(item.liquidityUst))}
                />
              </div>
              <div style={{ flex: 2 }}>
                <List
                  data={(topLiquidity || [])?.map((item) => {
                    const {
                      token0,
                      token0Symbol,
                      token1,
                      token1Symbol,
                      liquidityUst,
                      pairAddress,
                    } = item

                    return (
                      <Link
                        to={`/pairs/${pairAddress}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          flexWrap: "nowrap",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div>
                          <AssetIcon address={token0} alt={token0Symbol} />
                          <AssetIcon
                            address={token1}
                            alt={token1Symbol}
                            style={{ left: -8 }}
                          />
                        </div>
                        <div>
                          {token0Symbol}-{token1Symbol} /&nbsp;
                          {formatMoney(Number(lookup(liquidityUst, UST)))} UST
                        </div>
                      </Link>
                    )
                  })}
                />
              </div>
            </div>
          </Card>
        </Row>
        <Row>
          <Card>
            <Row style={{ marginBottom: 10 }}>
              <div>
                <b>Pairs</b>
              </div>
              <div style={{ textAlign: "right" }}>
                <input
                  type="search"
                  inputMode="search"
                  placeholder="Search"
                  onChange={(e) => {
                    setSearchKeyword(e?.target?.value || "")
                  }}
                />
              </div>
            </Row>
            <Row>
              <Table
                isLoading={isPairsLoading}
                columns={[
                  {
                    accessor: "pairAlias",
                    Header: "Pairs",
                    Cell: (data: any) => {
                      const { original } = data?.row
                      if (!original) {
                        return ""
                      }
                      const {
                        token0,
                        token0Symbol,
                        token1,
                        token1Symbol,
                        pairAlias,
                      } = original
                      return (
                        <>
                          <AssetIcon address={token0} alt={token0Symbol} />
                          <AssetIcon
                            address={token1}
                            alt={token1Symbol}
                            style={{ left: -8 }}
                          />
                          <span>{pairAlias}</span>
                        </>
                      )
                    },
                  },
                  {
                    accessor: "liquidityUst",
                    Header: "Liquidity",
                    Cell: ({ cell: { value } }: any) => (
                      <span>
                        {formatMoney(Number(lookup(`${value}`, UST)))} UST
                      </span>
                    ),
                  },
                  {
                    accessor: "volumeUst",
                    Header: "Volume(24h)",
                    Cell: ({ cell: { value } }: any) => (
                      <span>
                        {formatMoney(Number(lookup(`${value}`, UST)))} UST
                      </span>
                    ),
                  },
                  {
                    accessor: "apr",
                    Header: "Commission",
                    Cell: ({ cell: { value } }: any) => (
                      <span>{(Number(value) * 100).toFixed(2)}%</span>
                    ),
                  },
                ]}
                data={pairs || []}
                onRowClick={(row) =>
                  history.push(`/pairs/${row.original.pairAddress}`)
                }
                wrapperStyle={{ tableLayout: "fixed" }}
                cellStyle={{ width: 160 }}
                searchKeyword={searchKeyword}
              />
            </Row>
          </Card>
        </Row>
      </Container>
    </Wrapper>
  )
}

export default Dashboard
