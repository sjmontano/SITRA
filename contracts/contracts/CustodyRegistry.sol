// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CustodyRegistry is EIP712 {
    using ECDSA for bytes32;
    bytes32 private constant TRANSFER_TYPEHASH = keccak256("Transfer(address from,address to,bytes32 resourceId,bytes32 hashEvento,bytes32 hashPDF,uint256 nonce)");
    enum Estado { DISPONIBLE, ENTREGADO, RECIBIDO, EN_CUSTODIA, TRANSFERIDO, DEVUELTO, BAJA }

    struct Evento { bytes32 resourceId; uint8 eventType; address from; address to; bytes32 hashEvento; bytes32 hashPDF; uint256 timestamp; Estado estado; }
    mapping(bytes32 => address) public custodioActual;
    mapping(bytes32 => uint256) public nonces;
    mapping(bytes32 => bool) public existe;
    mapping(address => bool) public institucion;
    mapping(bytes32 => Evento[]) private _historia;

    event ResourceRegistered(bytes32 indexed resourceId, address indexed to, bytes32 hashEvento, bytes32 hashPDF);
    event CustodyTransferred(bytes32 indexed resourceId, address indexed from, address indexed to, bytes32 hashEvento, bytes32 hashPDF, uint256 nonce);
    event ResourceReturned(bytes32 indexed resourceId, address indexed from, bytes32 hashEvento);
    event ResourceRetired(bytes32 indexed resourceId, address indexed by, bytes32 hashEvento);
    event InstitutionRegistered(address indexed inst);
    event InstitutionKeyRotated(address indexed oldKey, address indexed newKey);

    constructor() EIP712("CustodiaActas", "1") {}

    function registerInstitution(address inst) external {
        require(inst != address(0), "inst0");
        require(!institucion[inst], "ya");
        institucion[inst] = true;
        emit InstitutionRegistered(inst);
    }
    function rotateInstitutionKey(address oldKey, address newKey, bytes calldata sigOld, bytes calldata sigNew) external {
        require(institucion[oldKey] && !institucion[newKey], "gob");
        bytes32 d = _hashTypedDataV4(keccak256(abi.encode(TRANSFER_TYPEHASH, oldKey, newKey, bytes32(0), bytes32(0), bytes32(0), 0)));
        require(d.recover(sigOld) == oldKey && d.recover(sigNew) == newKey, "doble-firma-rotate");
        institucion[oldKey] = false; institucion[newKey] = true;
        emit InstitutionKeyRotated(oldKey, newKey);
    }
    function registerResource(bytes32 resourceId, address to, bytes32 hashEvento, bytes32 hashPDF) external {
        require(!existe[resourceId], "existe");
        require(institucion[msg.sender], "no-inst");
        existe[resourceId] = true; custodioActual[resourceId] = to;
        _historia[resourceId].push(Evento(resourceId, 0, msg.sender, to, hashEvento, hashPDF, block.timestamp, Estado.DISPONIBLE));
        emit ResourceRegistered(resourceId, to, hashEvento, hashPDF);
    }
    function executeTransfer(bytes32 resourceId, address from, address to, bytes32 hashEvento, bytes32 hashPDF, bytes calldata sigFrom, bytes calldata sigTo) external {
        require(existe[resourceId], "no-existe");
        require(from == custodioActual[resourceId], "no-custodio");
        require(to != from && institucion[to], "to-no-inst");
        uint256 nonce = nonces[resourceId] + 1;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(TRANSFER_TYPEHASH, from, to, resourceId, hashEvento, hashPDF, nonce)));
        require(digest.recover(sigFrom) == from, "sigFrom");
        require(digest.recover(sigTo) == to, "sigTo");
        nonces[resourceId] = nonce; custodioActual[resourceId] = to;
        _historia[resourceId].push(Evento(resourceId, 1, from, to, hashEvento, hashPDF, block.timestamp, Estado.TRANSFERIDO));
        emit CustodyTransferred(resourceId, from, to, hashEvento, hashPDF, nonce);
    }
    function returnResource(bytes32 resourceId, bytes32 hashEvento) external {
        require(existe[resourceId] && msg.sender == custodioActual[resourceId], "solo-custodio");
        _historia[resourceId].push(Evento(resourceId, 2, msg.sender, msg.sender, hashEvento, bytes32(0), block.timestamp, Estado.DEVUELTO));
        emit ResourceReturned(resourceId, msg.sender, hashEvento);
    }
    function retireResource(bytes32 resourceId, bytes32 hashEvento, bytes calldata sigCust, bytes calldata sigInst) external {
        address c = custodioActual[resourceId];
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(TRANSFER_TYPEHASH, c, msg.sender, resourceId, hashEvento, bytes32(0), nonces[resourceId]+1)));
        require(digest.recover(sigCust) == c, "sigCust");
        require(institucion[msg.sender] && digest.recover(sigInst) == msg.sender, "sigInst");
        _historia[resourceId].push(Evento(resourceId, 3, c, msg.sender, hashEvento, bytes32(0), block.timestamp, Estado.BAJA));
        emit ResourceRetired(resourceId, msg.sender, hashEvento);
    }
    function historia(bytes32 resourceId) external view returns (Evento[] memory) { return _historia[resourceId]; }
}
