import {AStarFinder, DiagonalMovement, Grid} from 'pathfinding';
import {CoordinateFeature, FullCoordinate, SimpleCoordinate, Transport} from "@/app/model/coordinate";

export interface RouteOptions {
    avoidFeatures: CoordinateFeature[]; // Features to avoid
    useTransports?: boolean; // Whether to use transports
}

export interface RouteResult {
    directions: string; // Printable route directions for forward route
    routeCoordinates: SimpleCoordinate[]; // Highlighted route coordinates for forward route
    routeBack?: {
        directions: string; // Printable route directions for the return route
        routeCoordinates: SimpleCoordinate[]; // Highlighted route coordinates for the return route
    };
}

const MAX_STEPS = 20;

export class OptimizedRouteGenerator {
    private map: FullCoordinate[];
    private maxX: number;
    private maxY: number;
    private readonly transports: FullCoordinate[]
    private readonly targets: FullCoordinate[]

    constructor(map: FullCoordinate[], maxX: number, maxY: number) {
        this.map = map;
        this.maxX = maxX;
        this.maxY = maxY;
        this.transports = map
            .filter((coord) => coord.transports && coord.transports.length > 0)
        this.targets = map
            .filter((coord) => coord.name &&
                coord.features?.some(
                    (f) => f === CoordinateFeature.TRANSPORT_TARGET))
    }

    private initializeGrid(avoidFeatures: CoordinateFeature[]): Grid {
        const gridMatrix = Array.from({length: this.maxY + 1}, () =>
            Array(this.maxX + 1).fill(0)
        );

        this.map.forEach((coord) => {
            if (coord.features?.some((feature) => avoidFeatures.includes(feature))) {
                gridMatrix[coord.y][coord.x] = 1; // Mark cell as unwalkable
            }
        });

        return new Grid(gridMatrix);
    }

    private convertPathToDirections(path: number[][]): { directions: string; routeCoordinates: SimpleCoordinate[] } {
        const directions: string[] = [];
        const routeCoordinates: SimpleCoordinate[] = [];

        for (let i = 1; i < path.length; i++) {
            const [prevX, prevY] = path[i - 1];
            const [currX, currY] = path[i];

            // Wrap coordinates
            const wrappedPrev = this.wrapCoordinate({x: prevX, y: prevY, z: 0});
            const wrappedCurr = this.wrapCoordinate({x: currX, y: currY, z: 0});

            routeCoordinates.push(wrappedCurr);

            const dx = wrappedCurr.x - wrappedPrev.x;
            const dy = wrappedCurr.y - wrappedPrev.y;

            const direction = this.getStepDirection(dx, dy);
            directions.push(direction);
        }

        return this.compressDirections({directions: directions.join(";"), routeCoordinates});
    }

    private getStepDirection(dx: number, dy: number): string {
        if (dx === 1 && dy === 0) return "e";
        if (dx === -1 && dy === 0) return "w";
        if (dx === 0 && dy === -1) return "n"; // Adjusted: -1 is north
        if (dx === 0 && dy === 1) return "s"; // Adjusted: +1 is south
        if (dx === 1 && dy === -1) return "ne"; // Adjusted for reversed y
        if (dx === -1 && dy === -1) return "nw"; // Adjusted for reversed y
        if (dx === 1 && dy === 1) return "se"; // Adjusted for reversed y
        if (dx === -1 && dy === 1) return "sw"; // Adjusted for reversed y
        return "";
    }

    private calculateDistance(coordA: SimpleCoordinate, coordB: SimpleCoordinate): number {
        const wrappedA = this.wrapCoordinate(coordA);
        const wrappedB = this.wrapCoordinate(coordB);

        const dx = Math.abs(wrappedA.x - wrappedB.x);
        const dy = Math.abs(wrappedA.y - wrappedB.y);

        // Consider wrapping
        const wrappedDx = Math.min(dx, this.maxX + 1 - dx);
        const wrappedDy = Math.min(dy, this.maxY + 1 - dy);

        return wrappedDx + wrappedDy;
    }

    private compressDirections(route: { directions: string; routeCoordinates: SimpleCoordinate[] }): {
        directions: string;
        routeCoordinates: SimpleCoordinate[];
    } {
        const directionList = route.directions.split(";").filter((d) => d.trim() !== "");
        const compressedDirections: string[] = [];
        let currentDirection: string | null = null;
        let count = 0;

        for (const dir of directionList) {
            const match = dir.match(/^(\d+)?\s*(\w+)$/); // Match optional number and direction
            if (!match) continue;

            const stepCount = parseInt(match[1] || "1", 10); // Default to 1 if no number
            const direction = match[2];

            if (currentDirection === direction) {
                count += stepCount;
            } else {
                // Handle the previous direction
                while (count > MAX_STEPS) {
                    compressedDirections.push(`${MAX_STEPS} ${currentDirection}`);
                    count -= MAX_STEPS;
                }
                if (count > 0) {
                    compressedDirections.push(`${count > 1 ? count + " " : ""}${currentDirection}`);
                }
                // Start a new direction
                currentDirection = direction;
                count = stepCount;
            }
        }

        // Handle the final direction
        while (count > MAX_STEPS) {
            compressedDirections.push(`${MAX_STEPS} ${currentDirection}`);
            count -= MAX_STEPS;
        }
        if (count > 0) {
            compressedDirections.push(`${count > 1 ? count + " " : ""}${currentDirection}`);
        }

        return {
            directions: compressedDirections.join(";"),
            routeCoordinates: route.routeCoordinates,
        };
    }


    private findClosestTransport(
        start: SimpleCoordinate,
        transportTarget: string
    ): { transport: Transport; transportCoord: FullCoordinate } | null {
        let closestTransport: FullCoordinate | null = null;
        let minDistance = Infinity;

        this.transports.forEach((coord) => {
            if (coord.transports && coord.transports.length > 0) {
                if (coord.transports.find((t) => t.targetName === transportTarget)) {
                    const distance = this.calculateDistance(start, coord); // Use wrapping distance
                    if (distance < minDistance) {
                        closestTransport = coord;
                        minDistance = distance;
                    }
                }
            }
        });

        if (closestTransport) {
            const closestTransportCoordinate = closestTransport as FullCoordinate
            const closestTp = closestTransportCoordinate.transports?.find((tp) => tp.targetName === transportTarget);
            if (closestTp) {
                return {
                    transport: closestTp,
                    transportCoord: closestTransport,
                };
            }
        }

        return null;
    }


    private findClosestTransportTarget(targetCoord: SimpleCoordinate): FullCoordinate | null {
        let closestTarget: FullCoordinate | null = null;
        let minDistance = Infinity;

        this.targets.forEach((coord) => {
            if (coord && coord.name) {
                const distance = this.calculateDistance(targetCoord, coord); // Use wrapping distance
                if (distance < minDistance) {
                    closestTarget = coord;
                    minDistance = distance;
                }
            }
        });

        return closestTarget;
    }

    private wrapCoordinate(coord: SimpleCoordinate): SimpleCoordinate {
        return {
            x: (coord.x + this.maxX + 1) % (this.maxX + 1),
            y: (coord.y + this.maxY + 1) % (this.maxY + 1),
            z: coord.z,
        };
    }

    private customAStarFinder(
        start: SimpleCoordinate,
        end: SimpleCoordinate,
        grid: Grid
    ): number[][] {
        const openSet: number[][] = [[start.x, start.y]];
        const cameFrom: { [key: string]: number[] } = {};
        const gScore: { [key: string]: number } = {[`${start.x},${start.y}`]: 0};

        const h = (x: number, y: number) => this.calculateDistance({x, y, z: 0}, end);
        const fScore: { [key: string]: number } = {[`${start.x},${start.y}`]: h(start.x, start.y)};

        while (openSet.length > 0) {
            // Find the node in openSet with the lowest fScore
            const current = openSet.reduce((a, b) =>
                fScore[`${a[0]},${a[1]}`] < fScore[`${b[0]},${b[1]}`] ? a : b
            );

            // If reached the goal
            if (current[0] === end.x && current[1] === end.y) {
                const path = [];
                let temp = current;
                while (temp) {
                    path.unshift(temp);
                    temp = cameFrom[`${temp[0]},${temp[1]}`];
                }
                return path;
            }

            // Remove current from openSet
            openSet.splice(openSet.indexOf(current), 1);

            // Fetch neighbors with wrapping
            const neighbors = this.getWrappedNeighbors(current[0], current[1], grid);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor[0]},${neighbor[1]}`;
                const tentativeGScore = gScore[`${current[0]},${current[1]}`] + 1; // Assuming uniform cost

                if (tentativeGScore < (gScore[neighborKey] ?? Infinity)) {
                    cameFrom[neighborKey] = current;
                    gScore[neighborKey] = tentativeGScore;
                    fScore[neighborKey] = tentativeGScore + h(neighbor[0], neighbor[1]);

                    if (!openSet.find(([x, y]) => x === neighbor[0] && y === neighbor[1])) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // No path found
        return [];
    }

    getWrappedNeighbors(x: number, y: number, grid: Grid): number[][] {
        const neighbors: number[][] = [];
        const maxX = this.maxX + 1;
        const maxY = this.maxY + 1;

        const potentialNeighbors = [
            [x - 1, y], // Left
            [x + 1, y], // Right
            [x, y - 1], // Up
            [x, y + 1], // Down
        ];

        for (const [nx, ny] of potentialNeighbors) {
            const wrappedX = (nx + maxX) % maxX;
            const wrappedY = (ny + maxY) % maxY;

            if (grid.isWalkableAt(wrappedX, wrappedY)) {
                neighbors.push([wrappedX, wrappedY]);
            }
        }

        return neighbors;
    }

    createWrappedGrid(grid: Grid): Grid {
        const getWrappedNeighbors = this.getWrappedNeighbors
        return new Proxy(grid, {
            get(target: Grid, prop: keyof Grid) {
                if (prop === "getNeighbors") {
                    return (node: SimpleCoordinate): number[][] =>
                        getWrappedNeighbors(node.x, node.y, target);
                }
                return target[prop];
            },
        }) as Grid;
    }

    generateRoute(
        start: SimpleCoordinate,
        end: SimpleCoordinate,
        options: RouteOptions
    ): RouteResult {

        const wrappedStart = this.wrapCoordinate(start);
        const wrappedEnd = this.wrapCoordinate(end);

        const grid = this.initializeGrid(options.avoidFeatures);
        const wrappedGrid = this.createWrappedGrid(grid)

        const octileHeuristic = (dx: number, dy: number): number => {
            const F = Math.SQRT2 - 1;
            return dx < dy ? F * dx + dy : F * dy + dx;
        };

        const octileFinder = new AStarFinder({
            diagonalMovement: DiagonalMovement.OnlyWhenNoObstacles,
            heuristic: octileHeuristic,
            weight: 1,
        });

        const rawPath = this.customAStarFinder(
            wrappedStart,
            wrappedEnd,
            wrappedGrid
        );

        if ((!rawPath || rawPath.length === 0) && options.useTransports !== false) {
            console.warn("Direct path not found. Attempting to use transport.");

            // Step 2: Find the closest transport location
            const transportTarget = this.findClosestTransportTarget(end);
            if (!transportTarget || !transportTarget.name) {
                throw new Error("No transport target")
            }
            const targetName = transportTarget.name
            const transport = this.findClosestTransport(start, targetName);
            if (transport) {
                const transportCoord = transport.transportCoord;
                const transportTarget = this.map.find(
                    (coord) => coord.name === transport.transport.targetName
                );

                if (transportTarget) {
                    console.info("Using transport:", transport.transport.moveCommand);
                    // Step 3: Path to the transport location
                    const pathToTransport = octileFinder.findPath(
                        start.x,
                        start.y,
                        transportCoord.x,
                        transportCoord.y,
                        grid.clone()
                    );

                    if (pathToTransport.length > 0) {
                        const transportPathDirections = this.convertPathToDirections(pathToTransport);

                        // Step 4: Path from the transport target to the destination
                        const pathFromTransport = octileFinder.findPath(
                            transportTarget.x,
                            transportTarget.y,
                            end.x,
                            end.y,
                            grid.clone()
                        );

                        if (pathFromTransport.length > 0) {
                            const postTransportDirections = this.convertPathToDirections(pathFromTransport);

                            // Combine all route parts
                            return {
                                directions:
                                    transportPathDirections.directions +
                                    `;${transport.transport.moveCommand};` +
                                    postTransportDirections.directions,
                                routeCoordinates: [
                                    ...transportPathDirections.routeCoordinates,
                                    {
                                        x: transportCoord.x,
                                        y: transportCoord.y,
                                        z: transportCoord.z,
                                    },
                                    ...postTransportDirections.routeCoordinates,
                                ],
                            };
                        } else {
                            console.error("No path found from transport target to the destination.");
                        }
                    } else {
                        console.error("No path found to transport location.");
                    }
                } else {
                    console.error("No matching transport target found.");
                }
            } else {
                console.log("No transport available near the starting point.");
            }
        }

        // If a direct path was found
        if (rawPath && rawPath.length > 0) {
            const forwardRoute = this.convertPathToDirections(rawPath);
            return {
                directions: forwardRoute.directions,
                routeCoordinates: forwardRoute.routeCoordinates,
            };
        }

        // Return empty result if no path could be calculated
        console.log("No valid path found.");
        return {
            directions: "",
            routeCoordinates: [],
        };
    }
}
