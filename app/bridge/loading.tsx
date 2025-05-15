export default function Loading() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">  
            <div className="flex items-center justify-center h-[600px] w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#78c4b6]"></div>
            </div>  
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Loading bridge interface...</p>
          </div>
        </div>
      </div>
    )
  }
  