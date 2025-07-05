// Chrome API 类型声明
declare namespace chrome {
  namespace storage {
    namespace sync {
      function get(keys: string[], callback: (result: any) => void): void;
      function set(items: any, callback?: () => void): void;
    }
  }
  
  namespace runtime {
    function sendMessage(message: any): void;
    const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
    };
  }
  
  namespace tabs {
    function query(queryInfo: any, callback: (tabs: any[]) => void): void;
    function sendMessage(tabId: number, message: any): void;
  }
} 