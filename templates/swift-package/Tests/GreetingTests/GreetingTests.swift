import Greeting
import Testing

@Suite struct GreetingTests {
    @Test func greetsByName() {
        #expect(Greeting(name: "Ada").text == "Hello, Ada!")
    }
}
