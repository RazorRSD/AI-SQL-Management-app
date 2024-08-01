import Footer from "#/components/footer";
import Loading from "#/components/loading";
// import MainWin from "#/components/mainwin";
import Toolbar from "#/components/toolbar";
import { AIProvider } from "#/providers/aiContext";
import { DataProvider } from "#/providers/dataContext";
import { EditorProvider } from "#/providers/editorContext";
import dynamic from "next/dynamic";

const MainWin = dynamic(() => import("#/components/mainwin"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <DataProvider>
        <AIProvider>
          <EditorProvider>
            <div>
              <Toolbar />
              <MainWin />
              <Footer />
            </div>
          </EditorProvider>
        </AIProvider>
      </DataProvider>
    </main>
  );
}
