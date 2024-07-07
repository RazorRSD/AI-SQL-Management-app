import { DataContext } from "#/providers/dataContext";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { useContext, useState } from "react";

interface ConnectionModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

const ConnectionModal = ({ isOpen, onOpenChange }: ConnectionModalProps) => {
  const { handleConnection } = useContext(DataContext);

  const [connectionData, setConnectionData] = useState({
    dbType: "mysql",
    host: "localhost",
    port: "3306",
    user: "root",
    password: "",
  });

  const [error, setError] = useState("");

  const handleConnect = async () => {
    const { status, message } = await handleConnection(
      connectionData.dbType,
      connectionData.host,
      parseInt(connectionData.port),
      connectionData.user,
      connectionData.password
    );
    if (status === "success") {
      onOpenChange();
    } else {
      setError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Database Connection
            </ModalHeader>

            <ModalBody>
              <div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
              </div>
              <Autocomplete
                defaultSelectedKey={"mysql"}
                label="Database Provider"
                onSelectionChange={(selected) => {
                  setConnectionData({
                    ...connectionData,
                    dbType: selected?.toString() || "mysql",
                  });
                }}
              >
                <AutocompleteItem key={"mysql"} value="mysql">
                  MySQL
                </AutocompleteItem>
                <AutocompleteItem key={"postgres"} value="postgres">
                  Postgres
                </AutocompleteItem>
                <AutocompleteItem key={"sqlite"} value="sqlite">
                  SQLite
                </AutocompleteItem>
              </Autocomplete>

              <Input
                label="Host"
                placeholder="localhost"
                defaultValue="localhost"
                onChange={(e) =>
                  setConnectionData({
                    ...connectionData,
                    host: e.target.value,
                  })
                }
              />

              <Input
                label="Port"
                placeholder="3306"
                defaultValue="3306"
                onChange={(e) =>
                  setConnectionData({
                    ...connectionData,
                    port: e.target.value,
                  })
                }
              />

              <Input
                label="User"
                placeholder="root"
                defaultValue="root"
                onChange={(e) =>
                  setConnectionData({
                    ...connectionData,
                    user: e.target.value,
                  })
                }
              />

              <Input
                label="Password"
                type="password"
                placeholder="password"
                onChange={(e) =>
                  setConnectionData({
                    ...connectionData,
                    password: e.target.value,
                  })
                }
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={handleConnect}>
                Connect
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ConnectionModal;
